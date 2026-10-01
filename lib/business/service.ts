import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { BusinessMemberRole, Prisma } from "@prisma/client";
import {
  AccountScopeError,
  assertCanInScope,
  type BusinessAccountScope,
} from "@/lib/account-scope";
import { getAppBaseUrl } from "@/lib/app-url";
import { recordAuditLog } from "@/lib/audit-log";
import type { AuthenticatedAppUser } from "@/lib/authenticated-user";
import {
  BUSINESS_INVITE_TTL_DAYS,
  BUSINESS_ROLE_LABELS,
  type InvitableBusinessRole,
} from "@/lib/business/constants";
import { sendBusinessInviteEmail, sendBusinessVerificationEmail } from "@/lib/business/emails";
import { reassignMemberBusinessRecords } from "@/lib/business/member-lifecycle";
import { canAssignRole, canManageMemberRole } from "@/lib/business/permissions";
import {
  slugifyBusinessName,
  type BusinessProfileInput,
} from "@/lib/business/validation";
import { safeCreateNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

/** A user-facing failure; the message is safe to show in the UI. */
export class BusinessActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessActionError";
  }
}

const IDENTITY_FIELDS = ["name", "businessType", "registrationNumber", "cacDocumentUrl"] as const;

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function buildUniqueSlug(name: string, tx: Prisma.TransactionClient) {
  const base = slugifyBusinessName(name);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${randomBytes(2).toString("hex")}`;
    const existing = await tx.business.findUnique({ where: { slug: candidate }, select: { id: true } });

    if (!existing) {
      return candidate;
    }
  }

  return `${base}-${randomUUID().slice(0, 8)}`;
}

async function assertRegistrationNumberAvailable(
  registrationNumber: string,
  exceptBusinessId?: string,
) {
  const clash = await prisma.business.findFirst({
    where: {
      registrationNumber,
      verificationStatus: { in: ["unsubmitted", "pending", "verified"] },
      ...(exceptBusinessId ? { id: { not: exceptBusinessId } } : {}),
    },
    select: { id: true },
  });

  if (clash) {
    throw new BusinessActionError(
      "A business with this CAC number is already registered on Catcher. If it belongs to you, ask its owner to invite you, or contact support.",
    );
  }
}

async function getBusinessManagers(businessId: string, excludeUserId?: string) {
  return prisma.businessMember.findMany({
    where: {
      businessId,
      role: { in: ["owner", "admin"] },
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
    },
    select: { userId: true, user: { select: { email: true } } },
  });
}

export async function listUserBusinesses(userId: string) {
  return prisma.businessMember.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
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
}

export async function createBusiness(
  user: AuthenticatedAppUser,
  input: BusinessProfileInput,
) {
  await assertRegistrationNumberAvailable(input.registrationNumber);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        id: randomUUID(),
        slug: await buildUniqueSlug(input.name, tx),
        ...input,
        verificationStatus: input.cacDocumentUrl ? "pending" : "unsubmitted",
        submittedAt: input.cacDocumentUrl ? now : null,
        createdByUserId: user.userId,
        members: {
          create: {
            id: randomUUID(),
            userId: user.userId,
            role: "owner",
          },
        },
      },
    });

    await recordAuditLog(
      {
        actorUserId: user.userId,
        action: "business_created",
        entityType: "Business",
        entityId: business.id,
        entityLabel: business.name,
        summary: `Registered business ${business.name} (${business.registrationNumber}).`,
        businessId: business.id,
        details: { verificationStatus: business.verificationStatus },
      },
      tx,
    );

    return business;
  });
}

export async function updateBusinessProfile(
  scope: BusinessAccountScope,
  input: BusinessProfileInput,
) {
  assertCanInScope(scope, "editBusiness");

  const current = await prisma.business.findUniqueOrThrow({ where: { id: scope.businessId } });

  if (input.registrationNumber !== current.registrationNumber) {
    await assertRegistrationNumberAvailable(input.registrationNumber, current.id);
  }

  const identityChanged = IDENTITY_FIELDS.some((field) => input[field] !== current[field]);
  // Changing the legal identity of a verified or pending business sends it
  // back for review, so the Verified badge always matches the documents.
  const needsReview = identityChanged && Boolean(input.cacDocumentUrl);
  const now = new Date();

  const business = await prisma.business.update({
    where: { id: current.id },
    data: {
      ...input,
      ...(identityChanged
        ? {
            verificationStatus: needsReview ? "pending" : "unsubmitted",
            submittedAt: needsReview ? now : null,
            verifiedAt: null,
            verifiedByUserId: null,
            verificationNote: null,
          }
        : {}),
    },
  });

  await recordAuditLog({
    actorUserId: scope.userId,
    action: identityChanged ? "business_identity_updated" : "business_profile_updated",
    entityType: "Business",
    entityId: business.id,
    entityLabel: business.name,
    summary: identityChanged
      ? `Updated the legal details of ${business.name}; verification reset to ${business.verificationStatus}.`
      : `Updated the profile of ${business.name}.`,
    businessId: business.id,
  });

  return business;
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export async function listBusinessTeam(scope: BusinessAccountScope) {
  const [members, invites] = await Promise.all([
    prisma.businessMember.findMany({
      where: { businessId: scope.businessId },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, profileImageUrl: true } },
      },
    }),
    prisma.businessInvite.findMany({
      where: { businessId: scope.businessId, status: "pending" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
        invitedBy: { select: { name: true } },
      },
    }),
  ]);

  return { members, invites };
}

export async function createBusinessInvite(
  scope: BusinessAccountScope,
  inviter: Pick<AuthenticatedAppUser, "name">,
  email: string,
  role: InvitableBusinessRole,
) {
  assertCanInScope(scope, "manageMembers");

  if (!canAssignRole(scope.role, role)) {
    throw new BusinessActionError(`Your role cannot invite ${BUSINESS_ROLE_LABELS[role].toLowerCase()}s.`);
  }

  const existingMember = await prisma.businessMember.findFirst({
    where: { businessId: scope.businessId, user: { email } },
    select: { id: true },
  });

  if (existingMember) {
    throw new BusinessActionError(`${email} is already a member of this business.`);
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + BUSINESS_INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const invite = await prisma.$transaction(async (tx) => {
    // One live invite per email: a re-invite replaces the old link.
    await tx.businessInvite.updateMany({
      where: { businessId: scope.businessId, email, status: "pending" },
      data: { status: "revoked" },
    });

    const created = await tx.businessInvite.create({
      data: {
        id: randomUUID(),
        businessId: scope.businessId,
        email,
        role,
        tokenHash: hashInviteToken(token),
        invitedByUserId: scope.userId,
        expiresAt,
      },
    });

    await recordAuditLog(
      {
        actorUserId: scope.userId,
        action: "business_invite_sent",
        entityType: "BusinessInvite",
        entityId: created.id,
        entityLabel: email,
        summary: `Invited ${email} to ${scope.business.name} as ${BUSINESS_ROLE_LABELS[role]}.`,
        businessId: scope.businessId,
      },
      tx,
    );

    return created;
  });

  const emailed = await sendBusinessInviteEmail({
    to: email,
    businessName: scope.business.name,
    inviterName: inviter.name,
    roleLabel: BUSINESS_ROLE_LABELS[role],
    acceptUrl: `${getAppBaseUrl()}/business/invite/${token}`,
    expiresInDays: BUSINESS_INVITE_TTL_DAYS,
  });

  return { invite, emailed };
}

export async function revokeBusinessInvite(scope: BusinessAccountScope, inviteId: string) {
  assertCanInScope(scope, "manageMembers");

  const result = await prisma.businessInvite.updateMany({
    where: { id: inviteId, businessId: scope.businessId, status: "pending" },
    data: { status: "revoked" },
  });

  if (result.count === 0) {
    throw new BusinessActionError("That invitation is no longer pending.");
  }

  await recordAuditLog({
    actorUserId: scope.userId,
    action: "business_invite_revoked",
    entityType: "BusinessInvite",
    entityId: inviteId,
    summary: `Revoked a pending invitation to ${scope.business.name}.`,
    businessId: scope.businessId,
  });
}

export async function getInvitePreview(token: string) {
  const invite = await prisma.businessInvite.findUnique({
    where: { tokenHash: hashInviteToken(token) },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      business: {
        select: { id: true, name: true, logoUrl: true, verificationStatus: true },
      },
      invitedBy: { select: { name: true } },
    },
  });

  if (!invite) {
    return null;
  }

  const isExpired = invite.status === "pending" && invite.expiresAt.getTime() < Date.now();
  return { ...invite, status: isExpired ? ("expired" as const) : invite.status };
}

export async function acceptBusinessInvite(user: AuthenticatedAppUser, token: string) {
  const preview = await getInvitePreview(token);

  if (!preview || preview.status !== "pending") {
    throw new BusinessActionError(
      preview?.status === "expired"
        ? "This invitation has expired. Ask the business to send a new one."
        : "This invitation is no longer valid.",
    );
  }

  // The invite is bound to the address it was sent to; a forwarded link must
  // not let someone else join.
  if (!user.candidateEmails.includes(preview.email)) {
    throw new BusinessActionError(
      `This invitation was sent to ${preview.email}. Sign in with that email address to accept it.`,
    );
  }

  if (!user.emailVerified) {
    throw new BusinessActionError("Verify your email address with Catcher before joining a business.");
  }

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.businessInvite.updateMany({
      where: { id: preview.id, status: "pending" },
      data: { status: "accepted", acceptedAt: new Date(), acceptedByUserId: user.userId },
    });

    if (claimed.count === 0) {
      throw new BusinessActionError("This invitation is no longer valid.");
    }

    await tx.businessMember.upsert({
      where: { businessId_userId: { businessId: preview.business.id, userId: user.userId } },
      create: {
        id: randomUUID(),
        businessId: preview.business.id,
        userId: user.userId,
        role: preview.role,
      },
      update: {},
    });

    await recordAuditLog(
      {
        actorUserId: user.userId,
        action: "business_invite_accepted",
        entityType: "BusinessMember",
        entityId: preview.id,
        entityLabel: user.email,
        summary: `${user.name} joined ${preview.business.name} as ${BUSINESS_ROLE_LABELS[preview.role]}.`,
        businessId: preview.business.id,
      },
      tx,
    );
  });

  const managers = await getBusinessManagers(preview.business.id, user.userId);
  await Promise.all(
    managers.map((manager) =>
      safeCreateNotification({
        userId: manager.userId,
        type: "BusinessMemberJoined",
        title: `${user.name} joined ${preview.business.name}`,
        message: `${user.name} (${user.email}) accepted the invitation and joined as ${BUSINESS_ROLE_LABELS[preview.role]}.`,
        linkPath: "/dashboard/business/team",
        businessId: preview.business.id,
      }),
    ),
  );

  return preview.business;
}

async function loadManagedMember(scope: BusinessAccountScope, memberId: string) {
  const member = await prisma.businessMember.findFirst({
    where: { id: memberId, businessId: scope.businessId },
    select: { id: true, userId: true, role: true, user: { select: { name: true } } },
  });

  if (!member) {
    throw new AccountScopeError("That person is not a member of this business.", 404);
  }

  if (member.userId === scope.userId) {
    throw new BusinessActionError("You cannot change your own role. Ask another owner.");
  }

  if (!canManageMemberRole(scope.role, member.role)) {
    throw new BusinessActionError("Your role cannot manage this member.");
  }

  return member;
}

export async function changeMemberRole(
  scope: BusinessAccountScope,
  memberId: string,
  role: BusinessMemberRole,
) {
  const member = await loadManagedMember(scope, memberId);

  if (!canAssignRole(scope.role, role)) {
    throw new BusinessActionError(`Your role cannot make someone ${BUSINESS_ROLE_LABELS[role].toLowerCase()}.`);
  }

  await prisma.businessMember.update({ where: { id: member.id }, data: { role } });
  await recordAuditLog({
    actorUserId: scope.userId,
    action: "business_member_role_changed",
    entityType: "BusinessMember",
    entityId: member.id,
    entityLabel: member.user.name,
    summary: `Changed ${member.user.name}'s role from ${BUSINESS_ROLE_LABELS[member.role]} to ${BUSINESS_ROLE_LABELS[role]}.`,
    targetUserId: member.userId,
    businessId: scope.businessId,
  });
  await safeCreateNotification({
    userId: member.userId,
    type: "BusinessRoleChanged",
    title: `Your role in ${scope.business.name} changed`,
    message: `You are now ${BUSINESS_ROLE_LABELS[role]} in ${scope.business.name}.`,
    linkPath: "/dashboard",
    businessId: scope.businessId,
  });
}

async function firstOtherOwnerId(businessId: string, excludeUserId: string) {
  const owner = await prisma.businessMember.findFirst({
    where: { businessId, role: "owner", userId: { not: excludeUserId } },
    orderBy: { createdAt: "asc" },
    select: { userId: true },
  });

  return owner?.userId ?? null;
}

export async function removeMember(scope: BusinessAccountScope, memberId: string) {
  const member = await loadManagedMember(scope, memberId);
  const successorId =
    scope.role === "owner" ? scope.userId : await firstOtherOwnerId(scope.businessId, member.userId);

  if (!successorId) {
    throw new BusinessActionError("This business has no owner to take over the member's records.");
  }

  await prisma.$transaction(async (tx) => {
    await reassignMemberBusinessRecords(tx, scope.businessId, member.userId, successorId);
    await tx.businessMember.delete({ where: { id: member.id } });
    await recordAuditLog(
      {
        actorUserId: scope.userId,
        action: "business_member_removed",
        entityType: "BusinessMember",
        entityId: member.id,
        entityLabel: member.user.name,
        summary: `Removed ${member.user.name} from ${scope.business.name}.`,
        targetUserId: member.userId,
        businessId: scope.businessId,
      },
      tx,
    );
  });

  await safeCreateNotification({
    userId: member.userId,
    type: "BusinessMemberRemoved",
    title: `You were removed from ${scope.business.name}`,
    message: `You no longer have access to ${scope.business.name} on Catcher.`,
    linkPath: "/dashboard",
  });
}

export async function leaveBusiness(scope: BusinessAccountScope) {
  const successorId = await firstOtherOwnerId(scope.businessId, scope.userId);

  if (!successorId) {
    throw new BusinessActionError(
      scope.role === "owner"
        ? "You are the only owner. Transfer ownership to another member before leaving."
        : "This business has no owner to take over your records. Contact support.",
    );
  }

  await prisma.$transaction(async (tx) => {
    await reassignMemberBusinessRecords(tx, scope.businessId, scope.userId, successorId);
    await tx.businessMember.delete({
      where: { businessId_userId: { businessId: scope.businessId, userId: scope.userId } },
    });
    await recordAuditLog(
      {
        actorUserId: scope.userId,
        action: "business_member_left",
        entityType: "BusinessMember",
        entityId: scope.businessId,
        summary: `Left ${scope.business.name}.`,
        businessId: scope.businessId,
      },
      tx,
    );
  });
}

export async function transferOwnership(scope: BusinessAccountScope, memberId: string) {
  assertCanInScope(scope, "transferOwnership");

  const member = await prisma.businessMember.findFirst({
    where: { id: memberId, businessId: scope.businessId, userId: { not: scope.userId } },
    select: { id: true, userId: true, user: { select: { name: true } } },
  });

  if (!member) {
    throw new AccountScopeError("That person is not a member of this business.", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.businessMember.update({ where: { id: member.id }, data: { role: "owner" } });
    await tx.businessMember.update({
      where: { businessId_userId: { businessId: scope.businessId, userId: scope.userId } },
      data: { role: "admin" },
    });
    await recordAuditLog(
      {
        actorUserId: scope.userId,
        action: "business_ownership_transferred",
        entityType: "Business",
        entityId: scope.businessId,
        entityLabel: scope.business.name,
        summary: `Transferred ownership of ${scope.business.name} to ${member.user.name}.`,
        targetUserId: member.userId,
        businessId: scope.businessId,
      },
      tx,
    );
  });

  await safeCreateNotification({
    userId: member.userId,
    type: "BusinessRoleChanged",
    title: `You now own ${scope.business.name}`,
    message: `Ownership of ${scope.business.name} was transferred to you.`,
    linkPath: "/dashboard/business",
    businessId: scope.businessId,
  });
}

// ---------------------------------------------------------------------------
// Admin verification
// ---------------------------------------------------------------------------

export async function reviewBusinessVerification(options: {
  adminUserId: string;
  businessId: string;
  outcome: "verified" | "rejected";
  note: string | null;
}) {
  const business = await prisma.business.findUnique({
    where: { id: options.businessId },
    select: { id: true, name: true, verificationStatus: true, cacDocumentUrl: true },
  });

  if (!business) {
    throw new BusinessActionError("Business not found.");
  }

  if (options.outcome === "verified" && !business.cacDocumentUrl) {
    throw new BusinessActionError("A business cannot be verified without a CAC document.");
  }

  if (options.outcome === "rejected" && !options.note) {
    throw new BusinessActionError("Add a reason so the business knows what to fix.");
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.business.update({
      where: { id: business.id },
      data: {
        verificationStatus: options.outcome,
        verificationNote: options.note,
        verifiedAt: options.outcome === "verified" ? now : null,
        verifiedByUserId: options.adminUserId,
      },
    });
    await recordAuditLog(
      {
        actorUserId: options.adminUserId,
        action: options.outcome === "verified" ? "business_verified" : "business_verification_rejected",
        entityType: "Business",
        entityId: business.id,
        entityLabel: business.name,
        summary:
          options.outcome === "verified"
            ? `Verified ${business.name}.`
            : `Rejected verification for ${business.name}: ${options.note}`,
        businessId: business.id,
        details: { previousStatus: business.verificationStatus },
      },
      tx,
    );
  });

  const managers = await getBusinessManagers(business.id);
  const verified = options.outcome === "verified";

  await Promise.all(
    managers.map((manager) =>
      safeCreateNotification({
        userId: manager.userId,
        type: verified ? "BusinessVerified" : "BusinessVerificationRejected",
        title: verified ? `${business.name} is verified` : `${business.name} needs attention`,
        message: verified
          ? "Your business passed CAC verification. Its assets now show a Verified Business badge."
          : `Verification was not approved: ${options.note}`,
        linkPath: "/dashboard/business",
        businessId: business.id,
      }),
    ),
  );

  if (managers.length > 0) {
    await sendBusinessVerificationEmail({
      to: managers.map((manager) => manager.user.email),
      businessName: business.name,
      outcome: options.outcome,
      note: options.note,
      dashboardUrl: `${getAppBaseUrl()}/dashboard/business`,
    });
  }
}
