import { NextResponse } from "next/server";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { archiveNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ notificationId: string }> },
) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
    const { notificationId } = await context.params;

    if (!notificationId) {
      return NextResponse.json({ error: "notificationId is required" }, { status: 400 });
    }

    const notification = await archiveNotification(notificationId, authenticatedUser.userId);
    return NextResponse.json({
      id: notification.id,
      status: notification.status,
      archivedAt: notification.archivedAt?.toISOString() ?? null,
      message: "Notification archived.",
    });
  } catch (error) {
    console.error("Error archiving notification:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to archive notification." },
      { status: error instanceof Error && error.message === "Notification not found." ? 404 : 500 },
    );
  }
}
