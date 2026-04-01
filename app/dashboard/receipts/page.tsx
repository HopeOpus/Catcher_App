import { redirect } from 'next/navigation';
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from '@/lib/authenticated-user';
import { formatNgnFromKobo } from '@/lib/property-plans';
import { prisma } from '@/lib/prisma';
import ReceiptsPageClient, {
  type BillingReceiptListItem,
} from './receipts-page-client';

type ReceiptsPageProps = {
  searchParams?: Promise<{
    property?: string;
  }>;
};

async function getReceipts(userId: string): Promise<BillingReceiptListItem[]> {
  const receipts = await prisma.billingReceipt.findMany({
    where: {
      userId,
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
  });

  return receipts.map((receipt) => ({
    id: receipt.id,
    receiptNumber: receipt.receiptNumber,
    propertyId: receipt.property.id,
    propertyName: receipt.property.name,
    reference: receipt.reference,
    planName: receipt.planName,
    amountLabel: formatNgnFromKobo(receipt.amountKobo),
    startDate: receipt.startsAt.toISOString(),
    expiryDate: receipt.expiresAt?.toISOString() ?? null,
    issuedAt: receipt.issuedAt.toISOString(),
  }));
}

export default async function ReceiptsPage({
  searchParams,
}: ReceiptsPageProps) {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    redirect('/auth/signin');
  }

  await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const receipts = await getReceipts(authenticatedUser.userId);

  return (
    <ReceiptsPageClient
      receipts={receipts}
      initialPropertyFilter={resolvedSearchParams?.property ?? null}
    />
  );
}
