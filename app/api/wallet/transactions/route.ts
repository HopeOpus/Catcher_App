import { NextResponse } from "next/server";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { prisma } from "@/lib/prisma";
import { listWalletTransactions } from "@/lib/wallet";

function parseNumberParam(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export async function GET(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

    const { searchParams } = new URL(request.url);
    const limit = parseNumberParam(searchParams.get("limit"), 20);
    const offset = parseNumberParam(searchParams.get("offset"), 0);
    const type = searchParams.get("type");

    if (!Number.isInteger(limit) || limit <= 0) {
      return NextResponse.json(
        { error: "Limit must be a positive integer." },
        { status: 400 },
      );
    }

    if (!Number.isInteger(offset) || offset < 0) {
      return NextResponse.json(
        { error: "Offset must be zero or a positive integer." },
        { status: 400 },
      );
    }

    const result = await listWalletTransactions(authenticatedUser.userId, {
      limit,
      offset,
      type,
    });

    return NextResponse.json({
      ...result,
      message: "Wallet transactions fetched successfully.",
      status: 200,
      error: null,
    });
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    return NextResponse.json(
      {
        data: [],
        count: 0,
        next: "",
        previous: "",
        error: { message: "Failed to fetch wallet transactions" },
        status: 500,
        message: "Failed to fetch wallet transactions",
      },
      { status: 500 },
    );
  }
}
