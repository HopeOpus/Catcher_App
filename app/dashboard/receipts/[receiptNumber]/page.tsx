import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, CreditCard, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from '@/lib/authenticated-user';
import { formatNgnFromKobo } from '@/lib/property-plans';
import { prisma } from '@/lib/prisma';
import ReceiptViewActions from '../receipt-view-actions';

type ReceiptDetailPageProps = {
  params: Promise<{
    receiptNumber: string;
  }>;
};

function formatDate(value: Date | null) {
  if (!value) {
    return 'No expiry';
  }

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(value);
}

export default async function ReceiptDetailPage({
  params,
}: ReceiptDetailPageProps) {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    redirect('/auth/signin');
  }

  await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
  const { receiptNumber } = await params;
  const receipt = await prisma.billingReceipt.findFirst({
    where: {
      receiptNumber,
      userId: authenticatedUser.userId,
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          serialNumber: true,
          type: true,
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
  });

  if (!receipt) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 print:hidden lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#36689e]/10 text-[#0F2651]">
              {receipt.planName}
            </Badge>
            <Badge className="bg-slate-100 text-slate-700">
              {receipt.receiptNumber}
            </Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-[#0F2651]">Receipt</h1>
          <p className="mt-2 text-gray-600">
            Billing confirmation for {receipt.property.name}.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            variant="outline"
            className="border-[#36689e] text-[#0F2651]"
          >
            <Link href="/dashboard/receipts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Billing History
            </Link>
          </Button>
          <ReceiptViewActions />
        </div>
      </div>

      <Card className="print:shadow-none">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-2xl text-[#0F2651]">
                Catcher Receipt
              </CardTitle>
              <CardDescription className="mt-2">
                Issued {formatDate(receipt.issuedAt)}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 text-left md:text-right">
              <span className="text-sm font-medium text-slate-500">
                Receipt Number
              </span>
              <span className="text-lg font-semibold text-[#0F2651]">
                {receipt.receiptNumber}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 px-6 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#36689e]" />
                <h2 className="text-lg font-semibold text-[#0F2651]">
                  Property
                </h2>
              </div>
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-[#0F2651]">Name:</span>{' '}
                  {receipt.property.name}
                </p>
                <p>
                  <span className="font-medium text-[#0F2651]">Type:</span>{' '}
                  {receipt.property.type}
                </p>
                <p>
                  <span className="font-medium text-[#0F2651]">
                    Serial Number:
                  </span>{' '}
                  {receipt.property.serialNumber}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#36689e]" />
                <h2 className="text-lg font-semibold text-[#0F2651]">
                  Billing
                </h2>
              </div>
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-[#0F2651]">Plan:</span>{' '}
                  {receipt.planName}
                </p>
                <p>
                  <span className="font-medium text-[#0F2651]">Amount:</span>{' '}
                  {formatNgnFromKobo(receipt.amountKobo)}
                </p>
                <p>
                  <span className="font-medium text-[#0F2651]">Currency:</span>{' '}
                  {receipt.currency}
                </p>
                <p>
                  <span className="font-medium text-[#0F2651]">Reference:</span>{' '}
                  {receipt.reference ?? receipt.paymentEventLog?.reference ?? 'Not available'}
                </p>
                <p>
                  <span className="font-medium text-[#0F2651]">Status:</span>{' '}
                  {receipt.paymentEventLog?.transactionStatus ?? 'Confirmed'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Coverage Start
              </p>
              <p className="mt-2 text-sm font-medium text-[#0F2651]">
                {formatDate(receipt.startsAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Coverage End
              </p>
              <p className="mt-2 text-sm font-medium text-[#0F2651]">
                {formatDate(receipt.expiresAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Issued
              </p>
              <p className="mt-2 text-sm font-medium text-[#0F2651]">
                {formatDate(receipt.issuedAt)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#36689e]/20 bg-[#36689e]/5 px-5 py-5 text-sm text-slate-700">
            <p className="font-semibold text-[#0F2651]">Receipt note</p>
            <p className="mt-2">
              This document confirms payment for one protected property on
              Catcher. Use the print button above to save a PDF copy for your
              records.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
