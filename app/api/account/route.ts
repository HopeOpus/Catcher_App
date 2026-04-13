import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { recordAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const reason =
      body && typeof body.reason === "string" && body.reason.trim().length > 0
        ? body.reason.trim().slice(0, 500)
        : null;

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

    await prisma.$transaction(async (tx) => {
      await recordAuditLog(
        {
          actorUserId: authenticatedUser.userId,
          action: "self_delete_account",
          entityType: "User",
          entityId: authenticatedUser.userId,
          entityLabel: authenticatedUser.email ?? authenticatedUser.userId,
          summary: "User requested account deletion from the mobile app.",
          targetUserId: authenticatedUser.userId,
          details: {
            source: "mobile_app",
            reason,
            email: authenticatedUser.email ?? null,
          },
        },
        tx,
      );

      await tx.user.delete({
        where: { id: authenticatedUser.userId },
      });
    });

    let clerkDeleted = true;
    let warning: string | null = null;

    try {
      const client = await clerkClient();
      await client.users.deleteUser(authenticatedUser.userId);
    } catch (error) {
      clerkDeleted = false;
      warning =
        "Your app data was deleted, but your auth account could not be removed automatically. Please contact support if you can still sign in.";
      console.error("Failed to delete Clerk user during account deletion:", error);
    }

    return NextResponse.json({
      deleted: true,
      user_id: authenticatedUser.userId,
      clerk_deleted: clerkDeleted,
      warning,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete account";

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Failed to delete account"
            : errorMessage,
      },
      { status: 500 },
    );
  }
}
