import { NextResponse } from "next/server";
import {
  getCronAuthorizationErrorResponse,
  isCronRequestAuthorized,
} from "@/lib/cron-auth";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import { sendRestoreConfirmationFollowUpEmails } from "@/lib/property-notification-emails";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isCronRequestAuthorized(request)) {
      return getCronAuthorizationErrorResponse();
    }

    await syncPropertyLifecycle(prisma);
    const restoreConfirmations = await sendRestoreConfirmationFollowUpEmails();

    return NextResponse.json({
      ok: true,
      emails: {
        restoreConfirmations,
      },
    });
  } catch (error) {
    console.error("Property restores cron failed:", error);
    return NextResponse.json(
      { error: "Property restores cron failed" },
      { status: 500 },
    );
  }
}
