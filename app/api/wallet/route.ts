import { NextResponse } from "next/server";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { prisma } from "@/lib/prisma";
import { buildWalletSummary } from "@/lib/wallet";

export async function GET() {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
    const summary = await buildWalletSummary(authenticatedUser.userId);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching wallet summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet summary" },
      { status: 500 },
    );
  }
}
