import { randomUUID } from "node:crypto";
import { NotificationType, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { prisma } from "@/lib/prisma";
import { normalizeReferralCode } from "@/lib/referrals";
import {
  evaluateReferralAttachment,
  normalizeDeviceInstallId,
} from "@/lib/referral-guards";
import { safeCreateNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser(request);

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

    const body = await request.json().catch(() => ({}));
    const referralCode = normalizeReferralCode(body.referralCode);
    const deviceInstallId = normalizeDeviceInstallId(body.deviceInstallId);

    if (!referralCode) {
      return NextResponse.json(
        { error: "A valid referral code is required." },
        { status: 400 },
      );
    }

    const existingRelationship = await prisma.referralRelationship.findUnique({
      where: { referredUserId: authenticatedUser.userId },
      select: {
        id: true,
        referralCodeUsed: true,
        referrerUserId: true,
        fraudReviewStatus: true,
        fraudReviewReason: true,
      },
    });

    if (existingRelationship) {
      return NextResponse.json({
        status: "already_attached",
        referralCode: existingRelationship.referralCodeUsed,
        relationshipId: existingRelationship.id,
        referrerUserId: existingRelationship.referrerUserId,
        fraudReviewStatus: existingRelationship.fraudReviewStatus,
        fraudReviewReason: existingRelationship.fraudReviewReason,
      });
    }

    const [referrerProfile, currentUser, existingDeviceMatch, existingCheckoutActivity] =
      await Promise.all([
        prisma.referralProfile.findUnique({
          where: { referralCode },
          select: {
            id: true,
            userId: true,
            isDisabled: true,
            disabledAt: true,
            disabledReason: true,
          },
        }),
        prisma.user.findUnique({
          where: { id: authenticatedUser.userId },
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            createdAt: true,
          },
        }),
        deviceInstallId
          ? prisma.referralRelationship.findFirst({
              where: {
                attachDeviceInstallId: deviceInstallId,
              },
              select: {
                referredUserId: true,
                referrerUserId: true,
              },
            })
          : Promise.resolve(null),
        prisma.$transaction(async (tx) => {
          const [propertyCount, checkoutCount] = await Promise.all([
            tx.property.count({
              where: {
                userId: authenticatedUser.userId,
              },
            }),
            tx.propertyCheckoutSession.count({
              where: {
                userId: authenticatedUser.userId,
              },
            }),
          ]);

          return propertyCount > 0 || checkoutCount > 0;
        }),
      ]);

    if (!referrerProfile) {
      return NextResponse.json(
        { error: "Referral code not found." },
        { status: 404 },
      );
    }

    if (referrerProfile.isDisabled) {
      return NextResponse.json(
        {
          error:
            referrerProfile.disabledReason ??
            "This referral code has been disabled and can no longer be used.",
        },
        { status: 409 },
      );
    }

    const referrerUser = await prisma.user.findUnique({
      where: { id: referrerProfile.userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
      },
    });

    if (!currentUser || !referrerUser) {
      return NextResponse.json(
        { error: "Unable to verify this referral right now." },
        { status: 409 },
      );
    }

    const decision = evaluateReferralAttachment({
      authenticatedUser,
      currentUser,
      referrerUser,
      deviceInstallId,
      existingDeviceMatch,
      hasExistingCheckoutActivity: existingCheckoutActivity,
    });

    if (decision.outcome === "blocked") {
      return NextResponse.json(
        { error: decision.reason },
        { status: 409 },
      );
    }

    try {
      const relationship = await prisma.referralRelationship.create({
        data: {
          id: randomUUID(),
          referralProfileId: referrerProfile.id,
          referrerUserId: referrerProfile.userId,
          referredUserId: authenticatedUser.userId,
          referralCodeUsed: referralCode,
          status: "attached",
          fraudReviewStatus: decision.fraudReviewStatus,
          fraudReviewReason: decision.reviewReason,
          attachDeviceInstallId: deviceInstallId,
          metadata: {
            source: "mobile_app",
            attachMethod: "authenticated_api",
            emailVerifiedAtAttach: authenticatedUser.emailVerified,
          },
        },
      });

      await safeCreateNotification({
        userId: relationship.referrerUserId,
        type: NotificationType.ReferralSignupDetected,
        title: "A new referral signed up with your link",
        message:
          relationship.fraudReviewStatus === "flagged"
            ? "A new referral joined using your code and is pending review before rewards can be confirmed."
            : "A new referral joined using your code. You will earn Catcher Security Credit once they complete their first paid or credit-backed registration.",
        payload: {
          relationshipId: relationship.id,
          referredUserId: authenticatedUser.userId,
          referralCode,
          fraudReviewStatus: relationship.fraudReviewStatus,
          targetMobileRoute: "/wallet/referrals",
        },
      });

      return NextResponse.json({
        status: "attached",
        referralCode,
        relationshipId: relationship.id,
        referrerUserId: relationship.referrerUserId,
        fraudReviewStatus: relationship.fraudReviewStatus,
        fraudReviewReason: relationship.fraudReviewReason,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const relationship = await prisma.referralRelationship.findUnique({
          where: { referredUserId: authenticatedUser.userId },
          select: {
            id: true,
            referralCodeUsed: true,
            referrerUserId: true,
            fraudReviewStatus: true,
            fraudReviewReason: true,
          },
        });

        if (relationship) {
          return NextResponse.json({
            status: "already_attached",
            referralCode: relationship.referralCodeUsed,
            relationshipId: relationship.id,
            referrerUserId: relationship.referrerUserId,
            fraudReviewStatus: relationship.fraudReviewStatus,
            fraudReviewReason: relationship.fraudReviewReason,
          });
        }
      }

      throw error;
    }
  } catch (error) {
    console.error("Error attaching referral code:", error);
    return NextResponse.json(
      { error: "Failed to attach referral code" },
      { status: 500 },
    );
  }
}


