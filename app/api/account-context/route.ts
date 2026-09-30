import { NextResponse } from "next/server";
import { canInScope, resolveAccountScope } from "@/lib/account-scope";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { listUserBusinesses } from "@/lib/business/service";
import { prisma } from "@/lib/prisma";

/**
 * The active account and the accounts the user can switch to. Drives the
 * dashboard account switcher.
 */
export async function GET(request: Request) {
  const authenticatedUser = await getAuthenticatedAppUser(request);

  if (!authenticatedUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

  const [scope, memberships] = await Promise.all([
    resolveAccountScope(authenticatedUser, request),
    listUserBusinesses(authenticatedUser.userId),
  ]);

  return NextResponse.json({
    personal: {
      name: authenticatedUser.name,
      email: authenticatedUser.email,
    },
    active:
      scope.kind === "business"
        ? {
            kind: "business",
            businessId: scope.businessId,
            name: scope.business.name,
            logoUrl: scope.business.logoUrl,
            role: scope.role,
            verificationStatus: scope.business.verificationStatus,
            canManageMembers: canInScope(scope, "manageMembers"),
          }
        : { kind: "personal" },
    businesses: memberships.map((membership) => ({
      businessId: membership.business.id,
      name: membership.business.name,
      logoUrl: membership.business.logoUrl,
      role: membership.role,
      verificationStatus: membership.business.verificationStatus,
    })),
  });
}
