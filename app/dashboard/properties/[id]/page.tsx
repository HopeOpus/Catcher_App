/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  FileText,
  Images,
  MapPin,
} from 'lucide-react';
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
import { normalizeStoredPhotoUrl } from '@/lib/catcher-domain';
import {
  getCoverageDisplayState,
  getCurrentAndUpcomingCoverage,
} from '@/lib/property-coverage';
import { syncPropertyLifecycle } from '@/lib/property-lifecycle';
import { formatNgnFromKobo } from '@/lib/property-plans';
import {
  buildPropertyVerificationPath,
  ensurePropertyPublicVerification,
} from '@/lib/property-public-verification';
import { prisma } from '@/lib/prisma';

type PropertyDetailsPageProps = {
  params: Promise<{
    id: string;
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

function getStatusTone(status: string) {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Flagged':
      return 'bg-amber-100 text-amber-800';
    case 'Stolen':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function getCoverageTone(label: string) {
  switch (label) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'Grace period':
      return 'bg-amber-100 text-amber-800';
    case 'Archived':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-red-100 text-red-800';
  }
}

function getPaymentStatusTone(status: string | null | undefined) {
  const normalizedStatus = status?.toLowerCase() ?? "";

  if (normalizedStatus.includes("success") || normalizedStatus.includes("complete")) {
    return "bg-green-100 text-green-800";
  }

  if (normalizedStatus.includes("pending") || normalizedStatus.includes("process")) {
    return "bg-amber-100 text-amber-800";
  }

  if (normalizedStatus.includes("fail") || normalizedStatus.includes("cancel")) {
    return "bg-red-100 text-red-800";
  }

  return "bg-slate-100 text-slate-700";
}

export default async function PropertyDetailsPage({
  params,
}: PropertyDetailsPageProps) {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    redirect('/auth/signin');
  }

  await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
  const { id } = await params;

  await syncPropertyLifecycle(prisma, {
    userId: authenticatedUser.userId,
    propertyId: id,
  });

  const property = await prisma.property.findFirst({
    where: {
      id,
      userId: authenticatedUser.userId,
    },
    include: {
      photos: {
        orderBy: { uploadedAt: 'asc' },
      },
      coverages: {
        include: {
          billingReceipt: {
            select: {
              receiptNumber: true,
            },
          },
        },
        orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
      },
      billingReceipts: {
        include: {
          paymentEventLog: {
            select: {
              reference: true,
              transactionStatus: true,
              processingOutcome: true,
            },
          },
        },
        orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
      },
      stolenReports: {
        orderBy: [{ createdAt: 'desc' }],
      },
      publicVerification: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!property) {
    notFound();
  }

  const publicVerification =
    property.publicVerification ??
    (await ensurePropertyPublicVerification({
      propertyId: property.id,
      propertyName: property.name,
      serialNumber: property.serialNumber,
    }).catch(() => null));

  const photoUrls = property.photos.map((photo) =>
    normalizeStoredPhotoUrl(photo.fileUrl),
  );
  const currentAndUpcoming = getCurrentAndUpcomingCoverage(property.coverages);
  const displayState = getCoverageDisplayState({
    coverage: currentAndUpcoming.currentCoverage,
    propertyArchivedAt: property.archivedAt,
  });
  const latestReceipt = property.billingReceipts[0] ?? null;
  const latestPaymentStatus =
    latestReceipt?.paymentEventLog?.transactionStatus ??
    latestReceipt?.paymentEventLog?.processingOutcome ??
    (latestReceipt ? 'Confirmed' : null);
  const primaryActionLabel = property.archivedAt
    ? 'Restore Subscription'
    : currentAndUpcoming.currentCoverage
      ? 'Manage Renewal'
      : 'Start Subscription';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={getStatusTone(property.status)}>{property.status}</Badge>
            <Badge className={getCoverageTone(displayState.label)}>
              {displayState.label}
            </Badge>
            {property.archivedAt ? (
              <Badge className="bg-slate-200 text-slate-700">Archived</Badge>
            ) : null}
          </div>
          <h1 className="mt-3 text-3xl font-bold text-[#0F2651]">
            {property.name}
          </h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            {property.type} · {property.serialNumber} · Registered{' '}
            {formatDate(property.dateRegistered)}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            variant="outline"
            className="border-[#36689e] text-[#0F2651]"
          >
            <Link href="/dashboard/properties">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Link>
          </Button>
          <Button asChild className="bg-[#36689e] text-white hover:bg-[#0F2651]">
            <Link
              href={`/dashboard/subscriptions?property=${encodeURIComponent(
                property.id,
              )}`}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {primaryActionLabel}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)]">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0F2651]">
                <Images className="h-5 w-5 text-[#36689e]" />
                All Photos
              </CardTitle>
              <CardDescription>
                Every image currently attached to this property record.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {photoUrls.length > 0 ? (
                <>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <img
                      src={
                        property.photoUrl
                          ? normalizeStoredPhotoUrl(property.photoUrl)
                          : photoUrls[0]
                      }
                      alt={property.name}
                      className="h-full max-h-[28rem] w-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {photoUrls.map((photoUrl, index) => (
                      <div
                        key={`${property.id}-photo-${index + 1}`}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={photoUrl}
                          alt={`${property.name} ${index + 1}`}
                          className="h-28 w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-12 text-center text-sm text-slate-500">
                  No photos uploaded for this property yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Subscription Timeline</CardTitle>
              <CardDescription>
                Coverage history, renewals, and lifecycle changes for this property.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {property.coverages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-sm text-slate-500">
                  This property does not have any coverage history yet.
                </div>
              ) : (
                property.coverages.map((coverage) => {
                  const coverageState = getCoverageDisplayState({
                    coverage,
                    propertyArchivedAt: property.archivedAt,
                  });

                  return (
                    <div
                      key={coverage.id}
                      className="rounded-2xl border border-slate-200 px-4 py-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-[#0F2651]">
                              {coverage.planName}
                            </h3>
                            <Badge className={getCoverageTone(coverageState.label)}>
                              {coverageState.label}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            {formatNgnFromKobo(coverage.priceNgnKobo)} · Starts{' '}
                            {formatDate(coverage.startsAt)}
                            {coverage.expiresAt
                              ? ` · Ends ${formatDate(coverage.expiresAt)}`
                              : ' · No expiry'}
                          </p>
                          {coverage.graceEndsAt ? (
                            <p className="mt-1 text-xs text-slate-500">
                              Grace ends {formatDate(coverage.graceEndsAt)}
                            </p>
                          ) : null}
                        </div>
                        {coverage.billingReceipt?.receiptNumber ? (
                          <Button
                            asChild
                            variant="outline"
                            className="border-[#36689e] text-[#0F2651]"
                          >
                            <Link
                              href={`/dashboard/receipts/${encodeURIComponent(
                                coverage.billingReceipt.receiptNumber,
                              )}`}
                            >
                              View Receipt
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Payment History</CardTitle>
              <CardDescription>
                Receipts and transaction references tied to this property.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {property.billingReceipts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-sm text-slate-500">
                  No receipts have been issued for this property yet.
                </div>
              ) : (
                property.billingReceipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="rounded-2xl border border-slate-200 px-4 py-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-[#0F2651]">
                            {receipt.planName}
                          </h3>
                          <Badge className="bg-[#36689e]/10 text-[#0F2651]">
                            {receipt.receiptNumber}
                          </Badge>
                          <Badge
                            className={getPaymentStatusTone(
                              receipt.paymentEventLog?.transactionStatus ??
                                receipt.paymentEventLog?.processingOutcome,
                            )}
                          >
                            {receipt.paymentEventLog?.transactionStatus ??
                              receipt.paymentEventLog?.processingOutcome ??
                              'Confirmed'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                          <span>Amount: {formatNgnFromKobo(receipt.amountKobo)}</span>
                          <span>Reference: {receipt.reference ?? 'Not available'}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                          <span>Issued {formatDate(receipt.issuedAt)}</span>
                          <span>Starts {formatDate(receipt.startsAt)}</span>
                          <span>Ends {formatDate(receipt.expiresAt)}</span>
                          {receipt.paymentEventLog?.transactionStatus ? (
                            <span>
                              Status: {receipt.paymentEventLog.transactionStatus}
                            </span>
                          ) : null}
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
                          <FileText className="mr-2 h-4 w-4" />
                          View Receipt
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Property Summary</CardTitle>
              <CardDescription>
                The key details and next subscription action for this property.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {property.description || 'No description provided.'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Current Subscription
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#0F2651]">
                    {currentAndUpcoming.currentCoverage?.planName ??
                      'No active plan'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Latest Payment
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-[#0F2651]">
                      {latestReceipt
                        ? formatNgnFromKobo(latestReceipt.amountKobo)
                        : 'No payment yet'}
                    </p>
                    {latestPaymentStatus ? (
                      <Badge className={getPaymentStatusTone(latestPaymentStatus)}>
                        {latestPaymentStatus}
                      </Badge>
                    ) : null}
                  </div>
                  {latestReceipt?.reference ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Ref: {latestReceipt.reference}
                    </p>
                  ) : latestReceipt?.paymentEventLog?.reference ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Ref: {latestReceipt.paymentEventLog.reference}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Next Renewal Point
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#0F2651]">
                    {currentAndUpcoming.currentCoverage?.expiresAt
                      ? formatDate(currentAndUpcoming.currentCoverage.expiresAt)
                      : property.archivedAt
                        ? 'Renew to restore'
                        : 'Choose a plan to activate'}
                  </p>
                </div>
                {property.archivedAt ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Archive Reason
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {property.archiveReason ||
                        'Archived by the property lifecycle.'}
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  asChild
                  className="bg-[#36689e] text-white hover:bg-[#0F2651]"
                >
                  <Link
                    href={`/dashboard/subscriptions?property=${encodeURIComponent(
                      property.id,
                    )}`}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {primaryActionLabel}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-[#36689e] text-[#0F2651]"
                >
                  <Link
                    href={`/dashboard/receipts?property=${encodeURIComponent(
                      property.id,
                    )}`}
                  >
                    View Billing History
                  </Link>
                </Button>
                {latestReceipt ? (
                  <Button
                    asChild
                    variant="outline"
                    className="border-[#36689e] text-[#0F2651]"
                  >
                    <Link
                      href={`/dashboard/receipts/${encodeURIComponent(
                        latestReceipt.receiptNumber,
                      )}`}
                    >
                      Latest Receipt
                    </Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Public Verification</CardTitle>
              <CardDescription>
                Share a public verification page for this property with a scan-ready QR code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {publicVerification ? (
                <>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Verification Path
                    </p>
                    <p className="mt-2 break-all text-sm font-medium text-[#0F2651]">
                      {buildPropertyVerificationPath(publicVerification.slug)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      asChild
                      className="bg-[#36689e] text-white hover:bg-[#0F2651]"
                    >
                      <Link
                        href={buildPropertyVerificationPath(
                          publicVerification.slug,
                        )}
                        target="_blank"
                      >
                        View Public Verification
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-[#36689e] text-[#0F2651]"
                    >
                      <Link
                        href={`${buildPropertyVerificationPath(
                          publicVerification.slug,
                        )}/qr`}
                        target="_blank"
                      >
                        Open Verification QR
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-sm text-slate-500">
                  This property does not have a public verification link yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Stolen Report History</CardTitle>
              <CardDescription>
                Every theft report submitted for this property.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {property.stolenReports.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-sm text-slate-500">
                  No stolen reports have been created for this property.
                </div>
              ) : (
                property.stolenReports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-slate-200 px-4 py-4"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={getStatusTone(report.status)}>
                          {report.status}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          Reported {formatDate(report.dateReported)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {report.location}
                      </div>
                      <p className="text-sm text-slate-600">
                        {report.description ||
                          'No additional description was provided.'}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {property.archivedAt ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  Archived properties are not available for normal stolen-report
                  actions until the subscription is restored.
                </div>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="border-red-200 text-red-600 hover:text-red-700"
                >
                  <Link href="/dashboard/stolen-reports">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Review All Stolen Reports
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
