import { NextResponse } from "next/server";
import {
  getCronAuthorizationErrorResponse,
  isCronRequestAuthorized,
} from "@/lib/cron-auth";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import {
  sendFinalArchiveWarningEmails,
  sendUpcomingExpiryReminderEmails,
} from "@/lib/property-notification-emails";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isCronRequestAuthorized(request)) {
      return getCronAuthorizationErrorResponse();
    }

    await syncPropertyLifecycle(prisma);
    const upcomingExpiryReminders = await sendUpcomingExpiryReminderEmails();
    const finalArchiveWarnings = await sendFinalArchiveWarningEmails();

    return NextResponse.json({
      ok: true,
      emails: {
        upcomingExpiryReminders,
        finalArchiveWarnings,
      },
    });
  } catch (error) {
    console.error("Property plan reminders cron failed:", error);
    return NextResponse.json(
      { error: "Property plan reminders cron failed" },
      { status: 500 },
    );
  }
}
