import { NextResponse } from "next/server";
import {
  finalizePaystackCheckoutByReference,
  getPropertyCheckoutReturnPathByReference,
} from "@/lib/property-checkout";
import { recordPaymentEvent } from "@/lib/payment-event-log";
import { getConfiguredPaystackEnvironment } from "@/lib/paystack";
import { consumeRateLimit, resolveRateLimitIdentifier } from "@/lib/rate-limit";

export const runtime = "nodejs";

function buildDashboardRedirect(
  request: Request,
  pathname: string,
  checkoutState: string,
  reference?: string,
) {
  const url = new URL(pathname, request.url);
  url.searchParams.set("checkout", checkoutState);

  if (reference) {
    url.searchParams.set("reference", reference);
  }

  return url;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  const rateLimit = await consumeRateLimit({
    scope: "paystack:callback",
    identifier: resolveRateLimitIdentifier({
      request,
      fallback: "paystack-callback",
    }),
    limit: 60,
    windowMs: 5 * 60 * 1000,
    blockDurationMs: 5 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.redirect(
      buildDashboardRedirect(request, "/dashboard/properties", "rate_limited"),
    );
  }

  if (!reference) {
    return NextResponse.redirect(
      buildDashboardRedirect(request, "/dashboard/properties", "error"),
    );
  }

  try {
    const returnPath = await getPropertyCheckoutReturnPathByReference(reference);
    try {
      await recordPaymentEvent({
        source: "callback",
        reference,
        providerEventType: "redirect_callback",
        providerEnvironment: getConfiguredPaystackEnvironment(),
        processingOutcome: "received",
        payload: {
          reference,
        },
      });
    } catch (loggingError) {
      console.error("Failed to record Paystack callback event:", loggingError);
    }
    const result = await finalizePaystackCheckoutByReference(reference, {
      source: "callback",
      providerEventType: "redirect_callback",
      payload: {
        reference,
      },
    });

    switch (result.outcome) {
      case "completed":
        return NextResponse.redirect(
          buildDashboardRedirect(request, returnPath, "success", reference),
        );
      case "pending":
        return NextResponse.redirect(
          buildDashboardRedirect(request, returnPath, "processing", reference),
        );
      case "review":
        return NextResponse.redirect(
          buildDashboardRedirect(request, returnPath, "review", reference),
        );
      case "failed":
        return NextResponse.redirect(
          buildDashboardRedirect(request, returnPath, "failed", reference),
        );
      default:
        return NextResponse.redirect(
          buildDashboardRedirect(request, returnPath, "error"),
        );
    }
  } catch (error) {
    console.error("Paystack callback verification failed:", error);
    const fallbackReturnPath = await getPropertyCheckoutReturnPathByReference(
      reference,
    ).catch(() => "/dashboard/properties");
    return NextResponse.redirect(
      buildDashboardRedirect(
        request,
        fallbackReturnPath,
        "processing",
        reference,
      ),
    );
  }
}
