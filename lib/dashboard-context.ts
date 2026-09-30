import { redirect } from "next/navigation";
import {
  lifecycleFilter,
  resolveAccountScope,
  type AccountScope,
} from "@/lib/account-scope";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
  type AuthenticatedAppUser,
} from "@/lib/authenticated-user";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import type { PropertyPlanAudience } from "@/lib/property-plans";
import { prisma } from "@/lib/prisma";

export type DashboardContext = {
  authenticatedUser: AuthenticatedAppUser;
  scope: AccountScope;
  audience: PropertyPlanAudience;
};

/**
 * Loads the signed-in user and the active account for a dashboard server
 * page, redirecting to sign-in when needed. Pass syncLifecycle to bring the
 * scope's coverages up to date before reading them.
 */
export async function getDashboardContext(options: {
  syncLifecycle?: boolean;
  propertyId?: string;
} = {}): Promise<DashboardContext> {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    redirect("/auth/signin");
  }

  await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
  const scope = await resolveAccountScope(authenticatedUser);

  if (options.syncLifecycle) {
    await syncPropertyLifecycle(prisma, {
      ...lifecycleFilter(scope),
      ...(options.propertyId ? { propertyId: options.propertyId } : {}),
    });
  }

  return {
    authenticatedUser,
    scope,
    audience: scope.kind === "business" ? "business" : "personal",
  };
}

/** Personal accounts get one lifetime free plan; businesses never do. */
export async function hasUsedFreePlan(context: DashboardContext): Promise<boolean> {
  if (context.scope.kind === "business") {
    return true;
  }

  const count = await prisma.propertyCoverage.count({
    where: { userId: context.authenticatedUser.userId, planCode: "free" },
  });

  return count > 0;
}
