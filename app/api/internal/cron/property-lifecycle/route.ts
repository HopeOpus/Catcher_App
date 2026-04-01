import { NextResponse } from "next/server";
import {
  getCronAuthorizationErrorResponse,
  isCronRequestAuthorized,
} from "@/lib/cron-auth";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import {
  sendArchiveConfirmationEmails,
  sendGracePeriodStartedEmails,
} from "@/lib/property-notification-emails";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isCronRequestAuthorized(request)) {
      return getCronAuthorizationErrorResponse();
    }

    const lifecycle = await syncPropertyLifecycle(prisma);
    const gracePeriodStarted = await sendGracePeriodStartedEmails();
    const archiveConfirmations = await sendArchiveConfirmationEmails();

    return NextResponse.json({
      ok: true,
      lifecycle,
      emails: {
        gracePeriodStarted,
        archiveConfirmations,
      },
    });
  } catch (error) {
    console.error("Property lifecycle cron failed:", error);
    return NextResponse.json(
      { error: "Property lifecycle cron failed" },
      { status: 500 },
    );
  }
}
