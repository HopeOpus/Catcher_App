'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FileText, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export type BillingReceiptListItem = {
  id: string;
  receiptNumber: string;
  propertyId: string;
  propertyName: string;
  reference: string | null;
  planName: string;
  amountLabel: string;
  startDate: string;
  expiryDate: string | null;
  issuedAt: string;
};

type ReceiptsPageClientProps = {
  receipts: BillingReceiptListItem[];
  initialPropertyFilter: string | null;
};

function formatDate(value: string | null) {
  if (!value) {
    return 'No expiry';
  }

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function ReceiptsPageClient({
  receipts,
  initialPropertyFilter,
}: ReceiptsPageClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyFilter, setPropertyFilter] = useState(
    initialPropertyFilter ?? 'all',
  );

  const propertyOptions = useMemo(() => {
    const unique = new Map<string, string>();

    receipts.forEach((receipt) => {
      unique.set(receipt.propertyId, receipt.propertyName);
    });

    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return receipts.filter((receipt) => {
      if (propertyFilter !== 'all' && receipt.propertyId !== propertyFilter) {
        return false;
      }

      if (!normalizedSearchTerm) {
        return true;
      }

      return [
        receipt.propertyName,
        receipt.receiptNumber,
        receipt.reference,
        receipt.planName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearchTerm);
    });
  }, [propertyFilter, receipts, searchTerm]);

  const summaryCards = [
    {
      label: 'Receipts',
      value: receipts.length,
    },
    {
      label: 'Filtered',
      value: filteredReceipts.length,
    },
    {
      label: 'Paid Properties',
      value: propertyOptions.length,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F2651]">Billing History</h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            View every property payment, open the receipt, and keep a printable
            billing record.
          </p>
        </div>
        <Button asChild className="bg-[#36689e] text-white hover:bg-[#0F2651]">
          <Link href="/dashboard/subscriptions">Manage Subscriptions</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((summary) => (
          <Card key={summary.label}>
            <CardHeader className="pb-3">
              <CardDescription>{summary.label}</CardDescription>
              <CardTitle className="text-3xl text-[#0F2651]">
                {summary.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0F2651]">Search & Filters</CardTitle>
          <CardDescription>
            Search by property, receipt number, reference, or plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_280px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search receipts"
              className="pl-9"
            />
          </div>
          <select
            value={propertyFilter}
            onChange={(event) => setPropertyFilter(event.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <option value="all">All properties</option>
            {propertyOptions.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {filteredReceipts.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-300">
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-10 w-10 text-slate-400" />
            <h2 className="text-xl font-semibold text-[#0F2651]">
              No receipts found
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              As soon as a property subscription is paid and activated, its
              receipt will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReceipts.map((receipt) => (
            <Card key={receipt.id}>
              <CardContent className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-[#0F2651]">
                      {receipt.propertyName}
                    </h2>
                    <Badge className="bg-[#36689e]/10 text-[#0F2651]">
                      {receipt.planName}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span>Receipt: {receipt.receiptNumber}</span>
                    {receipt.reference ? (
                      <span>Reference: {receipt.reference}</span>
                    ) : null}
                    <span>Amount: {receipt.amountLabel}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>Coverage starts {formatDate(receipt.startDate)}</span>
                    <span>Coverage ends {formatDate(receipt.expiryDate)}</span>
                    <span>Issued {formatDate(receipt.issuedAt)}</span>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="border-[#36689e] text-[#0F2651]"
                >
                  <Link
                    href={`/dashboard/receipts/${encodeURIComponent(
                      receipt.receiptNumber,
                    )}`}
                  >
                    View Receipt
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
