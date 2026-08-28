import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { isDatabaseConnectionError } from "@/lib/database-errors";
import { prisma } from "@/lib/prisma";

type RateLimitWriteClient =
  | Pick<PrismaClient, "rateLimitBucket">
  | Pick<Prisma.TransactionClient, "rateLimitBucket">;

export type ConsumeRateLimitInput = {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
  blockDurationMs?: number;
  now?: Date;
  failOpenOnError?: boolean;
};

export type ConsumeRateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  totalHits: number;
  windowEndsAt: Date;
  blockedUntil: Date | null;
};

function getWindowStart(now: Date, windowMs: number) {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

export function resolveRateLimitIdentifier(options: {
  request: Request;
  userId?: string | null;
  fallback?: string;
}) {
  return resolveRateLimitIdentifierFromHeaders(options.request.headers, {
    userId: options.userId,
    fallback: options.fallback,
  });
}

export function resolveRateLimitIdentifierFromHeaders(
  headers: Headers,
  options: {
    userId?: string | null;
    fallback?: string;
  } = {},
) {
  if (options.userId) {
    return `user:${options.userId}`;
  }

  const forwardedFor = headers.get("x-forwarded-for");
  const realIp =
    forwardedFor?.split(",")[0]?.trim() ||
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip");

  if (realIp) {
    return `ip:${realIp}`;
  }

  return options.fallback ?? "anonymous";
}

export async function consumeRateLimit(
  input: ConsumeRateLimitInput,
  db: RateLimitWriteClient = prisma,
): Promise<ConsumeRateLimitResult> {
  const now = input.now ?? new Date();
  const windowStartedAt = getWindowStart(now, input.windowMs);
  const windowEndsAt = new Date(windowStartedAt.getTime() + input.windowMs);
  const blockDurationMs = input.blockDurationMs ?? input.windowMs;

  try {
    const bucket = await db.rateLimitBucket.upsert({
      where: {
        scope_identifier_windowStartedAt: {
          scope: input.scope,
          identifier: input.identifier,
          windowStartedAt,
        },
      },
      update: {
        hitCount: {
          increment: 1,
        },
        windowEndsAt,
      },
      create: {
        id: randomUUID(),
        scope: input.scope,
        identifier: input.identifier,
        windowStartedAt,
        windowEndsAt,
        hitCount: 1,
      },
    });

    let blockedUntil = bucket.blockedUntil ?? null;

    if (!blockedUntil && bucket.hitCount > input.limit) {
      blockedUntil = new Date(now.getTime() + blockDurationMs);

      await db.rateLimitBucket.update({
        where: { id: bucket.id },
        data: { blockedUntil },
      });
    }

    const effectiveBlockedUntil =
      blockedUntil && blockedUntil > now ? blockedUntil : null;
    const retryAfterSeconds = effectiveBlockedUntil
      ? Math.max(1, Math.ceil((effectiveBlockedUntil.getTime() - now.getTime()) / 1000))
      : 0;
    const remaining = effectiveBlockedUntil
      ? 0
      : Math.max(0, input.limit - bucket.hitCount);

    return {
      allowed: effectiveBlockedUntil === null,
      remaining,
      retryAfterSeconds,
      totalHits: bucket.hitCount,
      windowEndsAt,
      blockedUntil: effectiveBlockedUntil,
    };
  } catch (error) {
    if (input.failOpenOnError && isDatabaseConnectionError(error)) {
      console.warn(
        `Rate limit store unavailable for scope "${input.scope}". Allowing request temporarily.`,
        error,
      );

      return {
        allowed: true,
        remaining: input.limit,
        retryAfterSeconds: 0,
        totalHits: 0,
        windowEndsAt,
        blockedUntil: null,
      };
    }

    throw error;
  }
}
