import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import {
  getAuthenticatedAppUser,
  resolveAuthenticatedAppUserRole,
  type AuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { prisma } from "@/lib/prisma";

export type AdminAppUser = AuthenticatedAppUser & {
  role: UserRole;
};

async function getPersistedUserRole(
  authenticatedUser: AuthenticatedAppUser,
): Promise<UserRole | null> {
  await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

  const userRecord = await prisma.user.findUnique({
    where: { id: authenticatedUser.userId },
    select: {
      role: true,
    },
  });

  return resolveAuthenticatedAppUserRole(authenticatedUser, userRecord?.role ?? null);
}

export async function getCurrentAdminUser(): Promise<AdminAppUser | null> {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    return null;
  }

  const role = await getPersistedUserRole(authenticatedUser);

  if (role !== "Admin") {
    return null;
  }

  return {
    ...authenticatedUser,
    role,
  };
}

export async function requireAdminPageAccess(): Promise<AdminAppUser> {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    redirect("/auth/signin");
  }

  const role = await getPersistedUserRole(authenticatedUser);

  if (role !== "Admin") {
    redirect("/dashboard");
  }

  return {
    ...authenticatedUser,
    role,
  };
}

export async function assertAdminAccess(): Promise<AdminAppUser> {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    throw new Error("Forbidden");
  }

  return adminUser;
}
