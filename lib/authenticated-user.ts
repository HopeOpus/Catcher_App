import { auth, currentUser } from "@clerk/nextjs/server";
import type { Prisma, UserRole } from "@prisma/client";

export type AuthenticatedAppUser = {
  userId: string;
  email: string;
  name: string;
};

type UserSyncClient = Pick<
  Prisma.TransactionClient,
  | "user"
  | "property"
  | "propertyCoverage"
  | "propertyCheckoutSession"
  | "subscription"
  | "stolenReport"
>;

function parseAdminEmails(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminBootstrapEmail(email: string) {
  return parseAdminEmails(process.env.ADMIN_EMAILS).includes(
    email.trim().toLowerCase(),
  );
}

function resolvePersistedUserRole(options: {
  email: string;
  currentRole?: UserRole | null;
  migratedRole?: UserRole | null;
}): UserRole {
  const { email, currentRole = null, migratedRole = null } = options;

  if (currentRole === "Admin" || migratedRole === "Admin") {
    return "Admin";
  }

  if (isAdminBootstrapEmail(email)) {
    return "Admin";
  }

  return currentRole ?? migratedRole ?? "User";
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}

function getStringClaim(
  claims: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = claims[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

export async function getAuthenticatedAppUser(): Promise<AuthenticatedAppUser | null> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return null;
  }

  const claims =
    sessionClaims && typeof sessionClaims === "object"
      ? (sessionClaims as Record<string, unknown>)
      : {};

  let clerkUser = null;

  try {
    clerkUser = await currentUser();
  } catch (error) {
    console.error(
      "Failed to load Clerk currentUser; falling back to auth session claims.",
      error,
    );
  }

  const email =
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    getStringClaim(claims, "email", "email_address") ??
    `${userId}@catcher.local`;
  const name =
    clerkUser?.fullName?.trim() ||
    getStringClaim(claims, "name", "full_name") ||
    [
      clerkUser?.firstName ?? getStringClaim(claims, "given_name", "first_name"),
      clerkUser?.lastName ?? getStringClaim(claims, "family_name", "last_name"),
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    email.split("@")[0] ||
    "Catcher User";

  return {
    userId,
    email,
    name,
  };
}

export async function syncAuthenticatedAppUserRecord(
  db: UserSyncClient,
  authenticatedUser: AuthenticatedAppUser,
): Promise<AuthenticatedAppUser> {
  const existingUserById = await db.user.findUnique({
    where: { id: authenticatedUser.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      profileImageUrl: true,
      phoneNumber: true,
      nextOfKinEmail: true,
      nextOfKinPhone: true,
    },
  });
  const existingUserByEmail = await db.user.findUnique({
    where: { email: authenticatedUser.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      profileImageUrl: true,
      phoneNumber: true,
      nextOfKinEmail: true,
      nextOfKinPhone: true,
    },
  });

  const migratedProfileData =
    existingUserByEmail &&
    existingUserByEmail.id !== authenticatedUser.userId
      ? {
          role: existingUserByEmail.role,
          profileImageUrl: existingUserByEmail.profileImageUrl,
          phoneNumber: existingUserByEmail.phoneNumber,
          nextOfKinEmail: existingUserByEmail.nextOfKinEmail,
          nextOfKinPhone: existingUserByEmail.nextOfKinPhone,
        }
      : null;

  if (
    existingUserByEmail &&
    existingUserByEmail.id !== authenticatedUser.userId
  ) {
    await db.property.updateMany({
      where: { userId: existingUserByEmail.id },
      data: { userId: authenticatedUser.userId },
    });

    await db.propertyCoverage.updateMany({
      where: { userId: existingUserByEmail.id },
      data: { userId: authenticatedUser.userId },
    });

    await db.propertyCheckoutSession.updateMany({
      where: { userId: existingUserByEmail.id },
      data: { userId: authenticatedUser.userId },
    });

    await db.subscription.updateMany({
      where: { userId: existingUserByEmail.id },
      data: { userId: authenticatedUser.userId },
    });

    await db.stolenReport.updateMany({
      where: { userId: existingUserByEmail.id },
      data: { userId: authenticatedUser.userId },
    });

    await db.user.delete({
      where: { id: existingUserByEmail.id },
    });
  }

  if (existingUserById) {
    await db.user.update({
      where: { id: authenticatedUser.userId },
      data: {
        email: authenticatedUser.email,
        name: authenticatedUser.name,
        role: resolvePersistedUserRole({
          email: authenticatedUser.email,
          currentRole: existingUserById.role,
          migratedRole: migratedProfileData?.role,
        }),
        profileImageUrl:
          existingUserById.profileImageUrl ?? migratedProfileData?.profileImageUrl,
        phoneNumber:
          existingUserById.phoneNumber ?? migratedProfileData?.phoneNumber,
        nextOfKinEmail:
          existingUserById.nextOfKinEmail ?? migratedProfileData?.nextOfKinEmail,
        nextOfKinPhone:
          existingUserById.nextOfKinPhone ?? migratedProfileData?.nextOfKinPhone,
      },
    });

    return authenticatedUser;
  }

  await db.user.create({
    data: {
      id: authenticatedUser.userId,
      email: authenticatedUser.email,
      name: authenticatedUser.name,
      role: resolvePersistedUserRole({
        email: authenticatedUser.email,
        migratedRole: migratedProfileData?.role,
      }),
      profileImageUrl: migratedProfileData?.profileImageUrl ?? null,
      phoneNumber: migratedProfileData?.phoneNumber ?? null,
      nextOfKinEmail: migratedProfileData?.nextOfKinEmail ?? null,
      nextOfKinPhone: migratedProfileData?.nextOfKinPhone ?? null,
    },
  });

  return authenticatedUser;
}
