import { NextResponse } from "next/server";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { prisma } from "@/lib/prisma";
import { buildReferralLinks, ensureReferralProfile } from "@/lib/referrals";

export async function GET() {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
    const profile = await ensureReferralProfile(prisma, authenticatedUser.userId);
    const links = buildReferralLinks(profile.referralCode);

    return NextResponse.json({
      referralCode: profile.referralCode,
      shareableLink: links.shareableLink,
      deepLink: links.deepLink,
      qualifiedReferralCount: profile.qualifiedReferralCount,
      milestones: {
        milestone5AwardedAt: profile.milestone5AwardedAt?.toISOString() ?? null,
        milestone20AwardedAt: profile.milestone20AwardedAt?.toISOString() ?? null,
        milestone100AwardedAt: profile.milestone100AwardedAt?.toISOString() ?? null,
        ambassadorBadgeAwardedAt:
          profile.ambassadorBadgeAwardedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("Error fetching referral profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral profile" },
      { status: 500 },
    );
  }
}
