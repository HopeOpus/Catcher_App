import { ownershipWhere, type AccountScope } from '@/lib/account-scope';
import { getDashboardContext } from '@/lib/dashboard-context';
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

async function getReceipts(scope: AccountScope): Promise<BillingReceiptListItem[]> {
  const receipts = await prisma.billingReceipt.findMany({
    where: ownershipWhere(scope),
    include: {
      property: {
        select: {
          id: true,
          name: true,
        },
      },
      paymentEventLog: {
        select: {
          transactionStatus: true,
          processingOutcome: true,
          reference: true,
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
      reference: receipt.reference ?? receipt.paymentEventLog?.reference ?? null,
      planName: receipt.planName,
      amountLabel: formatNgnFromKobo(receipt.amountKobo),
      transactionStatus: receipt.paymentEventLog?.transactionStatus ?? null,
      processingOutcome: receipt.paymentEventLog?.processingOutcome ?? null,
      startDate: receipt.startsAt.toISOString(),
    expiryDate: receipt.expiresAt?.toISOString() ?? null,
    issuedAt: receipt.issuedAt.toISOString(),
  }));
}

export default async function ReceiptsPage({
  searchParams,
}: ReceiptsPageProps) {
  const { scope } = await getDashboardContext();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const receipts = await getReceipts(scope);

  return (
    <ReceiptsPageClient
      receipts={receipts}
      initialPropertyFilter={resolvedSearchParams?.property ?? null}
    />
  );
}
