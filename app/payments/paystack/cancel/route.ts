import { NextResponse } from "next/server";
import {
  cancelPaystackCheckoutByReference,
  getPropertyCheckoutReturnPathByReference,
} from "@/lib/property-checkout";
import { recordPaymentEvent } from "@/lib/payment-event-log";
import { getConfiguredPaystackEnvironment } from "@/lib/paystack";
import { consumeRateLimit, resolveRateLimitIdentifier } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  const rateLimit = await consumeRateLimit({
    scope: "paystack:cancel",
    identifier: resolveRateLimitIdentifier({
      request,
      fallback: "paystack-cancel",
    }),
    limit: 60,
    windowMs: 5 * 60 * 1000,
    blockDurationMs: 5 * 60 * 1000,
  });
  const redirectPath = reference
    ? await getPropertyCheckoutReturnPathByReference(reference)
    : "/dashboard/properties";
  const redirectUrl = new URL(`${redirectPath}?checkout=cancelled`, request.url);

  if (!rateLimit.allowed) {
    redirectUrl.searchParams.set("checkout", "rate_limited");
    return NextResponse.redirect(redirectUrl);
  }

  if (!reference) {
    return NextResponse.redirect(redirectUrl);
  }

  try {
    await cancelPaystackCheckoutByReference(reference);
    try {
      await recordPaymentEvent({
        source: "cancel",
        reference,
        providerEventType: "redirect_cancel",
        providerEnvironment: getConfiguredPaystackEnvironment(),
        processingOutcome: "cancelled",
        payload: {
          reference,
        },
      });
    } catch (loggingError) {
      console.error("Failed to record Paystack cancel event:", loggingError);
    }
  } catch (error) {
    console.error("Failed to cancel Paystack checkout session:", error);
  }

  return NextResponse.redirect(redirectUrl);
}
