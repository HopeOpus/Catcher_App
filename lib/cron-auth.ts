import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

function getCronSecret() {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    throw new Error("CRON_SECRET is not configured.");
  }

  return cronSecret;
}

function constantTimeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isCronRequestAuthorized(request: Request) {
  const expectedSecret = getCronSecret();
  const headerSecret = request.headers.get("x-catcher-cron-secret")?.trim();
  const authorizationHeader = request.headers.get("authorization")?.trim();
  const bearerToken = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length).trim()
    : null;

  return Boolean(
    (headerSecret && constantTimeEquals(headerSecret, expectedSecret)) ||
      (bearerToken && constantTimeEquals(bearerToken, expectedSecret)),
  );
}

export function getCronAuthorizationErrorResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
