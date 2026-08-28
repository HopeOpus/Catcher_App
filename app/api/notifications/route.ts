import { NextResponse } from "next/server";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { listNotificationsForUser } from "@/lib/notification-feed";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") ?? "20", 10);
    const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10);
    const status = searchParams.get("status");

    const result = await listNotificationsForUser(authenticatedUser.userId, {
      limit,
      offset,
      status,
    });

    return NextResponse.json({
      ...result,
      message: "Notifications fetched successfully.",
      status: 200,
      error: null,
    });
  } catch (error) {
    console.error("Error listing notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications." },
      { status: 500 },
    );
  }
}
