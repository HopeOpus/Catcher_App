import { NextResponse } from "next/server";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { prisma } from "@/lib/prisma";
import { normalizeReferralCode } from "@/lib/referrals";
import { transferWalletCredits } from "@/lib/wallet";

function normalizeRecipientEmail(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function toStatusCode(message: string) {
  if (message.startsWith("Daily transfer limit exceeded.")) {
    return 429;
  }

  if (message === "Recipient not found.") {
    return 404;
  }

  if (
    message === "Insufficient available credits for this transfer." ||
    message === "You cannot transfer credits to yourself."
  ) {
    return 409;
  }

  return 400;
}

export async function POST(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

    const body = await request.json().catch(() => ({}));
    const amountCredits = Number.parseInt(String(body.amountCredits ?? ""), 10);
    const recipientEmail = normalizeRecipientEmail(body.recipientEmail);
    const recipientReferralCode = normalizeReferralCode(body.recipientReferralCode);
    const note = typeof body.note === "string" ? body.note : null;

    if (!Number.isInteger(amountCredits) || amountCredits <= 0) {
      return NextResponse.json(
        { error: "Amount credits must be a positive whole number." },
        { status: 400 },
      );
    }

    const result = await transferWalletCredits({
      senderUserId: authenticatedUser.userId,
      amountCredits,
      recipientEmail,
      recipientReferralCode,
      note,
    });

    return NextResponse.json({
      ...result,
      message: "Transfer completed successfully.",
    });
  } catch (error) {
    console.error("Error transferring wallet credits:", error);
    const message =
      error instanceof Error ? error.message : "Failed to transfer wallet credits";

    return NextResponse.json(
      { error: message },
      { status: toStatusCode(message) },
    );
  }
}
