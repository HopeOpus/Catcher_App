import { NextResponse } from "next/server";
import { NotificationStatus } from "@prisma/client";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

    const result = await prisma.notification.updateMany({
      where: {
        userId: authenticatedUser.userId,
        status: NotificationStatus.unread,
      },
      data: {
        status: NotificationStatus.read,
        readAt: new Date(),
        archivedAt: null,
      },
    });

    return NextResponse.json({
      updatedCount: result.count,
      message: "Notifications marked as read.",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to update notifications." },
      { status: 500 },
    );
  }
}
