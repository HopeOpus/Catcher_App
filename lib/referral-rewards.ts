import { randomUUID } from "node:crypto";
import { NotificationType, Prisma, type PrismaClient } from "@prisma/client";
import { safeCreateNotification } from "@/lib/notifications";
import { REFERRAL_MILESTONES } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";
import { ensureWallet } from "@/lib/wallet";

const MAX_REWARD_RETRIES = 3;

function buildCreditExpiryDate(from: Date) {
  const expiresAt = new Date(from);
  expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1);
  return expiresAt;
}

type RewardWriteClient = Pick<PrismaClient, "$transaction">;

export type ReferralQualificationResult =
  | { outcome: "no_relationship" | "already_processed" | "ineligible_free_plan" | "blocked" | "flagged" }
  | {
      outcome: "qualified";
      relationshipId: string;
      relationshipStatus: "qualified" | "rewarded";
      referrerUserId: string;
      qualifiedReferralCount: number;
      milestoneRewards: Array<{
        target: number;
        rewardCredits: number;
        badgeName: string | null;
      }>;
    };

async function qualifyReferralForCompletedCheckoutOnce(
  input: {
    referredUserId: string;
    checkoutSessionId: string;
    coverageId: string;
    planCode: "free" | "monthly" | "yearly";
    qualifiedAt?: Date;
  },
  db: RewardWriteClient,
): Promise<ReferralQualificationResult> {
  if (input.planCode === "free") {
    return { outcome: "ineligible_free_plan" };
  }

  const qualifiedAt = input.qualifiedAt ?? new Date();

  return db.$transaction(
    async (tx) => {
      const relationship = await tx.referralRelationship.findUnique({
        where: { referredUserId: input.referredUserId },
        include: {
          referralProfile: {
            select: {
              id: true,
              userId: true,
              qualifiedReferralCount: true,
              milestone5AwardedAt: true,
              milestone20AwardedAt: true,
              milestone100AwardedAt: true,
              ambassadorBadgeAwardedAt: true,
            },
          },
        },
      });

      if (!relationship) {
        return { outcome: "no_relationship" } as const;
      }

      if (relationship.status === "rejected") {
        return { outcome: "blocked" } as const;
      }

      if (relationship.fraudReviewStatus === "blocked") {
        return { outcome: "blocked" } as const;
      }

      if (relationship.fraudReviewStatus === "flagged") {
        return { outcome: "flagged" } as const;
      }

      if (relationship.qualifiedAt || relationship.status === "qualified" || relationship.status === "rewarded") {
        return { outcome: "already_processed" } as const;
      }

      const referrerWallet = await ensureWallet(tx, relationship.referrerUserId);
      const nextQualifiedReferralCount = relationship.referralProfile.qualifiedReferralCount + 1;
      const milestoneRewards = REFERRAL_MILESTONES.filter((milestone) => {
        if (nextQualifiedReferralCount < milestone.target) {
          return false;
        }

        if (milestone.target === 5) {
          return !relationship.referralProfile.milestone5AwardedAt;
        }

        if (milestone.target === 20) {
          return !relationship.referralProfile.milestone20AwardedAt;
        }

        if (milestone.target === 100) {
          return !relationship.referralProfile.milestone100AwardedAt;
        }

        return false;
      });

      const totalMilestoneCredits = milestoneRewards.reduce(
        (sum, milestone) => sum + milestone.rewardCredits,
        0,
      );
      const relationshipStatus = totalMilestoneCredits > 0 ? "rewarded" : "qualified";

      await tx.referralProfile.update({
        where: { id: relationship.referralProfileId },
        data: {
          qualifiedReferralCount: { increment: 1 },
          milestone5AwardedAt: milestoneRewards.some((milestone) => milestone.target === 5)
            ? qualifiedAt
            : undefined,
          milestone20AwardedAt: milestoneRewards.some((milestone) => milestone.target === 20)
            ? qualifiedAt
            : undefined,
          milestone100AwardedAt: milestoneRewards.some((milestone) => milestone.target === 100)
            ? qualifiedAt
            : undefined,
          ambassadorBadgeAwardedAt: milestoneRewards.some((milestone) => milestone.target === 100)
            ? qualifiedAt
            : undefined,
        },
      });

      await tx.referralRelationship.update({
        where: { id: relationship.id },
        data: {
          status: relationshipStatus,
          qualifiedAt,
          rewardedAt: totalMilestoneCredits > 0 ? qualifiedAt : null,
          qualificationCheckoutSessionId: input.checkoutSessionId,
          qualificationCoverageId: input.coverageId,
          metadata: {
            ...(relationship.metadata && typeof relationship.metadata === "object" && !Array.isArray(relationship.metadata)
              ? relationship.metadata
              : {}),
            qualifiedPlanCode: input.planCode,
            qualifiedAt: qualifiedAt.toISOString(),
            rewardEngine: "phase_6_backend_checkout",
          },
        },
      });

      if (totalMilestoneCredits > 0) {
        const walletUpdate = await tx.wallet.update({
          where: { id: referrerWallet.id },
          data: {
            balanceCredits: { increment: totalMilestoneCredits },
            lifetimeEarnedCredits: { increment: totalMilestoneCredits },
          },
        });

        let runningBalance = walletUpdate.balanceCredits - totalMilestoneCredits;
        const expiresAt = buildCreditExpiryDate(qualifiedAt);

        await tx.walletTransaction.createMany({
          data: milestoneRewards.map((milestone) => {
            runningBalance += milestone.rewardCredits;
            return {
              id: randomUUID(),
              walletId: referrerWallet.id,
              userId: relationship.referrerUserId,
              type: "milestoneBonus",
              direction: "credit",
              amountCredits: milestone.rewardCredits,
              balanceAfterCredits: runningBalance,
              description:
                milestone.target === 100
                  ? `Referral milestone reached: ${milestone.target} successful referrals and Catcher Ambassador badge unlocked.`
                  : `Referral milestone reached: ${milestone.target} successful referrals.`,
              referenceType: "referral_milestone",
              referenceId: relationship.id,
              expiresAt,
              metadata: {
                referredUserId: input.referredUserId,
                qualificationCheckoutSessionId: input.checkoutSessionId,
                qualificationCoverageId: input.coverageId,
                milestoneTarget: milestone.target,
                badgeName: milestone.badgeName,
              },
            };
          }),
        });
      }

      return {
        outcome: "qualified",
        relationshipId: relationship.id,
        relationshipStatus,
        referrerUserId: relationship.referrerUserId,
        qualifiedReferralCount: nextQualifiedReferralCount,
        milestoneRewards: milestoneRewards.map((milestone) => ({
          target: milestone.target,
          rewardCredits: milestone.rewardCredits,
          badgeName: milestone.badgeName,
        })),
      } as const;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

export async function qualifyReferralForCompletedCheckout(
  input: {
    referredUserId: string;
    checkoutSessionId: string;
    coverageId: string;
    planCode: "free" | "monthly" | "yearly";
    qualifiedAt?: Date;
  },
  db: RewardWriteClient = prisma,
): Promise<ReferralQualificationResult> {
  let result: ReferralQualificationResult | null = null;

  for (let attempt = 0; attempt < MAX_REWARD_RETRIES; attempt += 1) {
    try {
      result = await qualifyReferralForCompletedCheckoutOnce(input, db);
      break;
    } catch (error) {
      const isRetryableSerializationFailure =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";

      if (!isRetryableSerializationFailure || attempt === MAX_REWARD_RETRIES - 1) {
        throw error;
      }
    }
  }

  if (!result) {
    throw new Error("Unable to finalize referral rewards right now.");
  }

  if (result.outcome === "qualified") {
    await safeCreateNotification({
      userId: result.referrerUserId,
      type: NotificationType.ReferralSuccessful,
      title: "A referral just became successful",
      message:
        result.milestoneRewards.length > 0
          ? `A referred user completed a qualifying registration. Your valid referral count is now ${result.qualifiedReferralCount}, and milestone rewards have been added to your Catcher Wallet.`
          : `A referred user completed a qualifying registration. Your valid referral count is now ${result.qualifiedReferralCount}. Keep sharing your link to unlock milestone rewards.`,
      payload: {
        relationshipId: result.relationshipId,
        checkoutSessionId: input.checkoutSessionId,
        coverageId: input.coverageId,
        qualifiedReferralCount: result.qualifiedReferralCount,
        milestoneRewards: result.milestoneRewards,
        targetMobileRoute: "/wallet/referrals",
      },
    });

    for (const milestone of result.milestoneRewards) {
      await safeCreateNotification({
        userId: result.referrerUserId,
        type: NotificationType.ReferralMilestoneReached,
        title: `Referral milestone reached: ${milestone.target}`,
        message: `You unlocked ${milestone.rewardCredits} Catcher Security Credits after reaching ${milestone.target} valid referrals.`,
        payload: {
          relationshipId: result.relationshipId,
          milestoneTarget: milestone.target,
          rewardCredits: milestone.rewardCredits,
          badgeName: milestone.badgeName,
          targetMobileRoute: "/wallet/referrals",
        },
      });

      if (milestone.badgeName) {
        await safeCreateNotification({
          userId: result.referrerUserId,
          type: NotificationType.AmbassadorBadgeEarned,
          title: `${milestone.badgeName} unlocked`,
          message: `You earned the ${milestone.badgeName} badge after reaching ${milestone.target} valid referrals.`,
          payload: {
            relationshipId: result.relationshipId,
            badgeName: milestone.badgeName,
            milestoneTarget: milestone.target,
            targetMobileRoute: "/wallet/referrals",
          },
        });
      }
    }
  }

  return result;
}
