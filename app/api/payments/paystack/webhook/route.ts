import { NextResponse } from "next/server";
import { finalizePaystackCheckoutByReference } from "@/lib/property-checkout";
import { recordPaymentEvent } from "@/lib/payment-event-log";
import { getConfiguredPaystackEnvironment } from "@/lib/paystack";
import { isPaystackWebhookSignatureValid } from "@/lib/paystack";
import { consumeRateLimit, resolveRateLimitIdentifier } from "@/lib/rate-limit";

export const runtime = "nodejs";

type PaystackWebhookPayload = {
  event?: string;
  data?: {
    reference?: string;
  };
};

export async function POST(request: Request) {
  const rateLimit = await consumeRateLimit({
    scope: "api:paystack:webhook",
    identifier: resolveRateLimitIdentifier({
      request,
      fallback: "paystack-webhook",
    }),
    limit: 180,
    windowMs: 5 * 60 * 1000,
    blockDurationMs: 5 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many webhook requests.",
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

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  let parsedPayload: PaystackWebhookPayload | null = null;

  try {
    parsedPayload = JSON.parse(rawBody) as PaystackWebhookPayload;
  } catch {
    parsedPayload = null;
  }

  try {
    if (!isPaystackWebhookSignatureValid(rawBody, signature)) {
      try {
        await recordPaymentEvent({
          source: "webhook",
          reference: parsedPayload?.data?.reference ?? null,
          providerEventType: parsedPayload?.event ?? "unknown",
          providerEnvironment: getConfiguredPaystackEnvironment(),
          signatureValid: false,
          processingOutcome: "rejected_signature",
          payload: parsedPayload ?? rawBody,
        });
      } catch (loggingError) {
        console.error("Failed to record invalid Paystack webhook event:", loggingError);
      }

      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = parsedPayload;

    try {
      await recordPaymentEvent({
        source: "webhook",
        reference: payload?.data?.reference ?? null,
        providerEventType: payload?.event ?? "unknown",
        providerEnvironment: getConfiguredPaystackEnvironment(),
        signatureValid: true,
        processingOutcome: "received",
        payload: payload ?? rawBody,
      });
    } catch (loggingError) {
      console.error("Failed to record Paystack webhook event:", loggingError);
    }

    if (payload?.event !== "charge.success") {
      return NextResponse.json({ received: true, ignored: true });
    }

    const reference = payload.data?.reference;

    if (!reference) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const result = await finalizePaystackCheckoutByReference(reference, {
      source: "webhook",
      providerEventType: payload.event,
      signatureValid: true,
      payload: payload,
    });

    return NextResponse.json({
      received: true,
      outcome: result.outcome,
    });
  } catch (error) {
    console.error("Paystack webhook handling failed:", error);
    return NextResponse.json(
      { error: "Webhook handling failed" },
      { status: 500 },
    );
  }
}
