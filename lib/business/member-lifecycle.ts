import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export class BusinessOwnershipError extends Error {
  constructor(readonly businessNames: string[]) {
    super(
      `Transfer ownership of ${businessNames.join(", ")} to another member before deleting your account.`,
    );
    this.name = "BusinessOwnershipError";
  }
}

/**
 * Hands a departing user's business records to a remaining owner. Business
 * records cascade from users (userId is "registered by"), so without this a
 * member deleting their account would delete the business's properties.
 *
 * Throws BusinessOwnershipError when the user is the only owner of a business.
 */
export async function reassignBusinessRecordsBeforeUserDeletion(tx: Tx, userId: string) {
  const businesses = await tx.business.findMany({
    where: {
      OR: [
        { members: { some: { userId } } },
        { createdByUserId: userId },
        { invites: { some: { invitedByUserId: userId } } },
        { properties: { some: { userId } } },
        { propertyCoverages: { some: { userId } } },
        { checkoutSessions: { some: { userId } } },
        { billingReceipts: { some: { userId } } },
        { stolenReports: { some: { userId } } },
      ],
    },
    select: {
      id: true,
      name: true,
      members: {
        where: { userId: { not: userId }, role: "owner" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { userId: true },
      },
    },
  });

  const orphaned = businesses.filter((business) => business.members.length === 0);

  if (orphaned.length > 0) {
    throw new BusinessOwnershipError(orphaned.map((business) => business.name));
  }

  for (const business of businesses) {
    await reassignMemberBusinessRecords(tx, business.id, userId, business.members[0].userId);
  }
}

/**
 * Moves the "registered by" link on a business's records from one member to
 * another. Used when a member leaves or is removed, so their later account
 * deletion cannot cascade into business data.
 */
export async function reassignMemberBusinessRecords(
  tx: Tx,
  businessId: string,
  fromUserId: string,
  toUserId: string,
) {
  const where = { businessId, userId: fromUserId };
  const data = { userId: toUserId };

  await tx.property.updateMany({ where, data });
  await tx.propertyCoverage.updateMany({ where, data });
  await tx.propertyCheckoutSession.updateMany({ where, data });
  await tx.billingReceipt.updateMany({ where, data });
  await tx.stolenReport.updateMany({ where, data });
  await tx.businessInvite.updateMany({
    where: { businessId, invitedByUserId: fromUserId },
    data: { invitedByUserId: toUserId },
  });
  await tx.business.updateMany({
    where: { id: businessId, createdByUserId: fromUserId },
    data: { createdByUserId: toUserId },
  });
}

/**
 * Moves business links from a superseded user row to the user's current id
 * (Clerk ids can change for the same email). Mirrors the record migration in
 * syncAuthenticatedAppUserRecord.
 */
export async function migrateBusinessLinksToUser(
  tx: Pick<Tx, "businessMember" | "business" | "businessInvite" | "billingReceipt" | "notification">,
  fromUserId: string,
  toUserId: string,
) {
  const [fromMemberships, toMemberships] = await Promise.all([
    tx.businessMember.findMany({ where: { userId: fromUserId }, select: { id: true, businessId: true } }),
    tx.businessMember.findMany({ where: { userId: toUserId }, select: { businessId: true } }),
  ]);
  const alreadyMember = new Set(toMemberships.map((membership) => membership.businessId));

  for (const membership of fromMemberships) {
    if (alreadyMember.has(membership.businessId)) {
      await tx.businessMember.delete({ where: { id: membership.id } });
    } else {
      await tx.businessMember.update({ where: { id: membership.id }, data: { userId: toUserId } });
    }
  }

  await tx.business.updateMany({ where: { createdByUserId: fromUserId }, data: { createdByUserId: toUserId } });
  await tx.business.updateMany({ where: { verifiedByUserId: fromUserId }, data: { verifiedByUserId: toUserId } });
  await tx.businessInvite.updateMany({ where: { invitedByUserId: fromUserId }, data: { invitedByUserId: toUserId } });
  await tx.billingReceipt.updateMany({ where: { userId: fromUserId }, data: { userId: toUserId } });
  await tx.notification.updateMany({ where: { userId: fromUserId }, data: { userId: toUserId } });
}
