import { headers } from "next/headers";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import { buildPropertyVerificationUrl } from "@/lib/property-public-verification";
import { prisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  resolveRateLimitIdentifierFromHeaders,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const headerStore = await headers();
  const rateLimit = await consumeRateLimit({
    scope: "public:verify:qr",
    identifier: resolveRateLimitIdentifierFromHeaders(headerStore, {
      fallback: "public-property-verification-qr",
    }),
    limit: 120,
    windowMs: 5 * 60 * 1000,
    blockDurationMs: 5 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many QR requests. Please try again shortly.",
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

  const { slug } = await context.params;

  const baseVerification = await prisma.propertyPublicVerification.findUnique({
    where: {
      slug,
    },
    select: {
      propertyId: true,
    },
  });

  if (!baseVerification) {
    return NextResponse.json({ error: "Verification record not found." }, { status: 404 });
  }

  await syncPropertyLifecycle(prisma, {
    propertyId: baseVerification.propertyId,
  });

  const verification = await prisma.propertyPublicVerification.findFirst({
    where: {
      slug,
      isActive: true,
      property: {
        archivedAt: null,
      },
    },
    select: {
      slug: true,
    },
  });

  if (!verification) {
    return NextResponse.json({ error: "Verification record not found." }, { status: 404 });
  }

  const verificationUrl = buildPropertyVerificationUrl(verification.slug);
  const svg = await QRCode.toString(verificationUrl, {
    type: "svg",
    margin: 1,
    width: 320,
    color: {
      dark: "#0F2651",
      light: "#FFFFFF",
    },
  });

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=300",
    },
  });
}
