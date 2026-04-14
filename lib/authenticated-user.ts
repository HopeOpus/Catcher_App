import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import type { Prisma, UserRole } from "@prisma/client";

export type AuthenticatedAppUser = {
  userId: string;
  email: string;
  name: string;
  candidateEmails: string[];
  emailVerified: boolean;
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

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function collectCandidateEmails(values: Array<string | null | undefined>) {
  const emails: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== "string" || value.trim().length === 0) {
      continue;
    }

    const normalized = normalizeEmail(value);

    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    emails.push(normalized);
  }

  return emails;
}

function isAdminBootstrapEmail(email: string) {
  return parseAdminEmails(process.env.ADMIN_EMAILS).includes(normalizeEmail(email));
}

export function isAdminBootstrapUser(
  authenticatedUser: Pick<AuthenticatedAppUser, "email" | "candidateEmails">,
) {
  return authenticatedUser.candidateEmails.some((email) => isAdminBootstrapEmail(email));
}

function resolvePersistedUserRole(options: {
  candidateEmails: string[];
  currentRole?: UserRole | null;
  migratedRole?: UserRole | null;
}): UserRole {
  const { candidateEmails, currentRole = null, migratedRole = null } = options;

  if (currentRole === "Admin" || migratedRole === "Admin") {
    return "Admin";
  }

  if (candidateEmails.some((email) => isAdminBootstrapEmail(email))) {
    return "Admin";
  }

  return currentRole ?? migratedRole ?? "User";
}

export function resolveAuthenticatedAppUserRole(
  authenticatedUser: Pick<AuthenticatedAppUser, "email" | "candidateEmails">,
  persistedRole?: UserRole | null,
): UserRole {
  if (persistedRole === "Admin") {
    return "Admin";
  }

  if (isAdminBootstrapUser(authenticatedUser)) {
    return "Admin";
  }

  return persistedRole ?? "User";
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

  if (!clerkUser) {
    try {
      const client = await clerkClient();
      clerkUser = await client.users.getUser(userId);
    } catch (error) {
      console.error(
        "Failed to load Clerk user by ID; continuing with auth session claims only.",
        error,
      );
    }
  }

  const primaryClerkEmail =
    clerkUser?.emailAddresses?.find(
      (emailAddress) => emailAddress.id === clerkUser?.primaryEmailAddressId,
    )?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    null;
  const candidateEmails = collectCandidateEmails([
    primaryClerkEmail,
    ...(clerkUser?.emailAddresses?.map((emailAddress) => emailAddress.emailAddress) ?? []),
    getStringClaim(claims, "email", "email_address"),
  ]);

  const email =
    candidateEmails[0] ??
    `${userId}@catcher.local`;
  const emailVerified =
    clerkUser?.emailAddresses?.some(
      (emailAddress) =>
        emailAddress.verification?.status === "verified" &&
        candidateEmails.includes(emailAddress.emailAddress.trim().toLowerCase()),
    ) ?? false;
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
    candidateEmails,
    emailVerified,
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
  const existingUserByEmail =
    authenticatedUser.candidateEmails.length > 0
      ? await db.user.findFirst({
          where: {
            email: {
              in: authenticatedUser.candidateEmails,
            },
          },
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
        })
      : null;

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
          candidateEmails: authenticatedUser.candidateEmails,
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
        candidateEmails: authenticatedUser.candidateEmails,
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



