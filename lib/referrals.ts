import { randomBytes, randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { getAppBaseUrl } from "@/lib/app-url";

const DEFAULT_MOBILE_REFERRAL_DEEP_LINK_BASE =
  process.env.NEXT_PUBLIC_MOBILE_REFERRAL_DEEP_LINK_BASE?.trim() ||
  "catcherapp://auth/register";

export const REFERRAL_MILESTONES = [
  { target: 5, rewardCredits: 7, badgeName: null },
  { target: 20, rewardCredits: 30, badgeName: null },
  { target: 100, rewardCredits: 200, badgeName: "Catcher Ambassador" },
] as const;

type ReferralProfileWriteClient =
  | Pick<PrismaClient, "referralProfile">
  | Pick<Prisma.TransactionClient, "referralProfile">;

export function normalizeReferralCode(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  return normalized.length > 0 ? normalized : null;
}

export function buildReferralLinks(referralCode: string) {
  const normalizedCode = normalizeReferralCode(referralCode);

  if (!normalizedCode) {
    throw new Error("Referral code is required to build referral links.");
  }

  const shareableLink = `${getAppBaseUrl()}/r/${encodeURIComponent(normalizedCode)}`;
  const deepLinkSeparator = DEFAULT_MOBILE_REFERRAL_DEEP_LINK_BASE.includes("?") ? "&" : "?";
  const deepLink = `${DEFAULT_MOBILE_REFERRAL_DEEP_LINK_BASE}${deepLinkSeparator}ref=${encodeURIComponent(normalizedCode)}`;

  return {
    referralCode: normalizedCode,
    shareableLink,
    deepLink,
  };
}

export function getNextReferralMilestone(qualifiedReferralCount: number) {
  const next = REFERRAL_MILESTONES.find(
    (milestone) => qualifiedReferralCount < milestone.target,
  );

  if (!next) {
    return null;
  }

  return {
    target: next.target,
    rewardCredits: next.rewardCredits,
    badgeName: next.badgeName,
    referralsRemaining: Math.max(next.target - qualifiedReferralCount, 0),
  };
}

function createReferralCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

function isUniqueConstraintError(error: unknown, fieldName?: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  if (!fieldName) {
    return true;
  }

  const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
  return target.includes(fieldName);
}

export async function ensureReferralProfile(
  db: ReferralProfileWriteClient,
  userId: string,
) {
  const existing = await db.referralProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing;
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      return await db.referralProfile.create({
        data: {
          id: randomUUID(),
          userId,
          referralCode: createReferralCode(),
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error, "user_id")) {
        const profile = await db.referralProfile.findUnique({
          where: { userId },
        });

        if (profile) {
          return profile;
        }
      }

      if (isUniqueConstraintError(error, "referral_code")) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Unable to generate a unique referral code right now.");
}
