import { cookies, headers } from "next/headers";
import type { BusinessMemberRole, BusinessVerificationStatus } from "@prisma/client";
import type { AuthenticatedAppUser } from "@/lib/authenticated-user";
import {
  ACTIVE_ACCOUNT_COOKIE,
  PERSONAL_ACCOUNT_KEY,
} from "@/lib/business/constants";
import { roleCan, type BusinessAction } from "@/lib/business/permissions";
import { prisma } from "@/lib/prisma";

/**
 * The account a request acts for. Every read or write of owned records
 * (properties, coverages, checkout sessions, receipts, stolen reports) goes
 * through ownershipWhere(scope) so personal and business data never mix.
 */
export type AccountScope =
  | {
      kind: "personal";
      userId: string;
    }
  | {
      kind: "business";
      userId: string;
      businessId: string;
      role: BusinessMemberRole;
      business: {
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
        verificationStatus: BusinessVerificationStatus;
      };
    };

export type BusinessAccountScope = Extract<AccountScope, { kind: "business" }>;

/** Header the mobile app can send instead of the web cookie. */
export const ACTIVE_ACCOUNT_HEADER = "x-catcher-account";

export class AccountScopeError extends Error {
  constructor(
    message: string,
    readonly status: 403 | 404 = 403,
  ) {
    super(message);
    this.name = "AccountScopeError";
  }
}

async function readRequestedAccountKey(request?: Request): Promise<string | null> {
  const fromRequest = request?.headers.get(ACTIVE_ACCOUNT_HEADER)?.trim();

  if (fromRequest) {
    return fromRequest;
  }

  const requestHeaders = await headers();
  const fromHeader = requestHeaders.get(ACTIVE_ACCOUNT_HEADER)?.trim();

  if (fromHeader) {
    return fromHeader;
  }

  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_ACCOUNT_COOKIE)?.value?.trim() || null;
}

export async function loadBusinessScope(
  userId: string,
  businessId: string,
): Promise<BusinessAccountScope | null> {
  const membership = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
    select: {
      role: true,
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          verificationStatus: true,
        },
      },
    },
  });

  if (!membership) {
    return null;
  }

  return {
    kind: "business",
    userId,
    businessId: membership.business.id,
    role: membership.role,
    business: membership.business,
  };
}

/**
 * Resolves the active account from the x-catcher-account header or the
 * catcher_account cookie. Anything missing, "personal" or pointing at a
 * business the user no longer belongs to falls back to the personal account,
 * so clients that know nothing about businesses keep their old behaviour.
 */
export async function resolveAccountScope(
  authenticatedUser: Pick<AuthenticatedAppUser, "userId">,
  request?: Request,
): Promise<AccountScope> {
  const requestedKey = await readRequestedAccountKey(request);

  if (requestedKey && requestedKey !== PERSONAL_ACCOUNT_KEY) {
    const businessScope = await loadBusinessScope(authenticatedUser.userId, requestedKey);

    if (businessScope) {
      return businessScope;
    }
  }

  return { kind: "personal", userId: authenticatedUser.userId };
}

/**
 * Prisma where-fragment selecting the records owned by the scope. Works for
 * every owned model because they all carry userId and businessId.
 */
export function ownershipWhere(
  scope: AccountScope,
): { userId: string; businessId: null } | { businessId: string } {
  return scope.kind === "business"
    ? { businessId: scope.businessId }
    : { userId: scope.userId, businessId: null };
}

/** The businessId to stamp on records created in this scope. */
export function scopeBusinessId(scope: AccountScope): string | null {
  return scope.kind === "business" ? scope.businessId : null;
}

export function canInScope(scope: AccountScope, action: BusinessAction): boolean {
  return scope.kind === "personal" ? true : roleCan(scope.role, action);
}

export function assertCanInScope(scope: AccountScope, action: BusinessAction) {
  if (!canInScope(scope, action)) {
    throw new AccountScopeError(
      "Your role in this business does not allow this action. Ask a business owner or admin for access.",
    );
  }
}

/** Filter for syncPropertyLifecycle matching the scope's properties. */
export function lifecycleFilter(scope: AccountScope) {
  return scope.kind === "business"
    ? { businessId: scope.businessId }
    : { userId: scope.userId };
}
