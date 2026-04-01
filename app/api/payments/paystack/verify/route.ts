import { NextResponse } from "next/server";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { finalizePaystackCheckoutByReference } from "@/lib/property-checkout";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, resolveRateLimitIdentifier } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "reference is required" },
        { status: 400 },
      );
    }

    const rateLimit = await consumeRateLimit({
      scope: "api:paystack:verify",
      identifier: resolveRateLimitIdentifier({
        request,
        userId: authenticatedUser.userId,
      }),
      limit: 30,
      windowMs: 5 * 60 * 1000,
      blockDurationMs: 5 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many verification attempts. Please wait a moment and try again.",
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

    const checkoutSession = await prisma.propertyCheckoutSession.findUnique({
      where: { paystackReference: reference },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!checkoutSession || checkoutSession.userId !== authenticatedUser.userId) {
      return NextResponse.json({ error: "Checkout session not found" }, { status: 404 });
    }

    const result = await finalizePaystackCheckoutByReference(reference, {
      source: "verify",
      providerEventType: "transaction.verify",
      payload: {
        reference,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error verifying Paystack checkout:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to verify payment.";

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Failed to verify payment."
            : errorMessage,
      },
      { status: 500 },
    );
  }
}
