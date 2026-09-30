import Link from 'next/link';
import type { BusinessVerificationStatus, Prisma } from '@prisma/client';
import { BadgeCheck, Building2, ExternalLink, FileText, Mail, MapPin, Phone, Users, XCircle } from 'lucide-react';
import { VerificationBadge } from '@/components/business/verification-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { requireAdminPageAccess } from '@/lib/admin-access';
import {
  BUSINESS_TYPE_LABELS,
  BUSINESS_VERIFICATION_LABELS,
  BUSINESS_VERIFICATION_STATUSES,
} from '@/lib/business/constants';
import { prisma } from '@/lib/prisma';
import { cn } from '@/lib/utils';
import {
  AdminPageHeader,
  AdminPageNotice,
  formatAdminDate,
  formatAdminDateTime,
  getAdminPageNotice,
  type AdminPageSearchParams,
} from '../admin-page-utils';
import { reviewBusinessAction } from './actions';

type StatusFilter = BusinessVerificationStatus | 'all';

function isStatusFilter(value: unknown): value is StatusFilter {
  return value === 'all' || (BUSINESS_VERIFICATION_STATUSES as readonly unknown[]).includes(value);
}

export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams?: AdminPageSearchParams;
}) {
  await requireAdminPageAccess();
  const notice = await getAdminPageNotice(searchParams);
  const resolved = searchParams ? await searchParams : {};
  const status: StatusFilter = isStatusFilter(resolved.filter) ? resolved.filter : 'pending';
  const query = typeof resolved.q === 'string' ? resolved.q.trim() : '';

  const where: Prisma.BusinessWhereInput = {
    ...(status === 'all' ? {} : { verificationStatus: status }),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { registrationNumber: { contains: query.replace(/\s+/g, ' '), mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [counts, businesses] = await Promise.all([
    prisma.business.groupBy({ by: ['verificationStatus'], _count: { _all: true } }),
    prisma.business.findMany({
      where,
      orderBy: status === 'pending' ? [{ submittedAt: 'asc' }] : [{ createdAt: 'desc' }],
      take: 100,
      include: {
        createdBy: { select: { name: true, email: true } },
        verifiedBy: { select: { name: true } },
        _count: { select: { members: true, properties: true } },
      },
    }),
  ]);

  const countByStatus = Object.fromEntries(
    counts.map((entry) => [entry.verificationStatus, entry._count._all]),
  ) as Partial<Record<BusinessVerificationStatus, number>>;
  const total = Object.values(countByStatus).reduce((sum, value) => sum + (value ?? 0), 0);
  const tabs: Array<{ key: StatusFilter; label: string; count: number }> = [
    { key: 'pending', label: 'Awaiting review', count: countByStatus.pending ?? 0 },
    { key: 'unsubmitted', label: BUSINESS_VERIFICATION_LABELS.unsubmitted, count: countByStatus.unsubmitted ?? 0 },
    { key: 'verified', label: 'Verified', count: countByStatus.verified ?? 0 },
    { key: 'rejected', label: 'Rejected', count: countByStatus.rejected ?? 0 },
    { key: 'all', label: 'All', count: total },
  ];
  const currentPath = `/admin/businesses?filter=${status}${query ? `&q=${encodeURIComponent(query)}` : ''}`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Businesses"
        description="Review CAC documents and verify business accounts. Verified businesses show a badge on their assets in the public registry."
      />
      <AdminPageNotice notice={notice} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter by verification status" className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/admin/businesses?filter=${tab.key}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
              aria-current={status === tab.key ? 'page' : undefined}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors',
                status === tab.key
                  ? 'border-[#0F2651] bg-[#0F2651] text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-[#36689e]/40',
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'rounded-full px-2 text-xs tabular-nums',
                  status === tab.key ? 'bg-white/20' : 'bg-slate-100 text-slate-600',
                )}
              >
                {tab.count}
              </span>
            </Link>
          ))}
        </nav>
        <form action="/admin/businesses" className="flex gap-2">
          <input type="hidden" name="filter" value={status} />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search name, CAC number or email"
            aria-label="Search businesses"
            className="h-10 w-full lg:w-72"
          />
          <Button type="submit" variant="outline" className="h-10">
            Search
          </Button>
        </form>
      </div>

      {businesses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Building2 aria-hidden className="h-8 w-8 text-slate-400" />
            <p className="font-medium text-[#0F2651]">No businesses here</p>
            <p className="text-sm text-slate-500">
              {status === 'pending' ? 'Nothing is waiting for review.' : 'Try another filter or search.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {businesses.map((business) => (
            <Card key={business.id} className="border-slate-200">
              <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-4">
                  <div className="flex flex-wrap items-start gap-3">
                    {business.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={business.logoUrl} alt="" className="h-12 w-12 rounded-xl border border-slate-200 object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F2651] font-semibold text-white">
                        {business.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-[#0F2651]">{business.name}</h2>
                        <VerificationBadge status={business.verificationStatus} />
                      </div>
                      <p className="text-sm text-slate-600">
                        <span className="font-mono font-medium">{business.registrationNumber}</span> ·{' '}
                        {BUSINESS_TYPE_LABELS[business.businessType]} · {business.industry}
                        {business.taxId ? ` · TIN ${business.taxId}` : ''}
                      </p>
                    </div>
                  </div>

                  <dl className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="flex gap-2">
                      <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <dd>
                        {business.addressLine}, {business.city}, {business.state}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <Mail aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <dd className="break-all">{business.email}</dd>
                    </div>
                    <div className="flex gap-2">
                      <Phone aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <dd>{business.phoneNumber}</dd>
                    </div>
                    <div className="flex gap-2">
                      <Users aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <dd>
                        {business._count.members} members · {business._count.properties} assets
                      </dd>
                    </div>
                  </dl>

                  <p className="text-xs text-slate-500">
                    Registered {formatAdminDate(business.createdAt)} by {business.createdBy.name} (
                    {business.createdBy.email})
                    {business.submittedAt ? ` · Submitted ${formatAdminDateTime(business.submittedAt)}` : ''}
                    {business.verifiedBy && business.verificationStatus !== 'pending'
                      ? ` · Reviewed by ${business.verifiedBy.name}`
                      : ''}
                  </p>

                  {business.verificationNote ? (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                      <span className="font-medium">Last review note:</span> {business.verificationNote}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {business.cacDocumentUrl ? (
                      <Button asChild variant="outline" size="sm" className="h-10">
                        <a href={business.cacDocumentUrl} target="_blank" rel="noreferrer">
                          <FileText aria-hidden className="mr-2 h-4 w-4" />
                          Open CAC document
                          <ExternalLink aria-hidden className="ml-2 h-3.5 w-3.5" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-sm text-amber-700">No CAC document uploaded yet.</span>
                    )}
                    {business.website ? (
                      <Button asChild variant="ghost" size="sm" className="h-10">
                        <a href={business.website} target="_blank" rel="noreferrer">
                          Website
                          <ExternalLink aria-hidden className="ml-2 h-3.5 w-3.5" />
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-[#0F2651]">Decision</p>
                  <p className="text-xs leading-5 text-slate-500">
                    Check that the certificate name, type and number match the details on the left before verifying.
                  </p>
                  <form action={reviewBusinessAction}>
                    <input type="hidden" name="business_id" value={business.id} />
                    <input type="hidden" name="redirect_to" value={currentPath} />
                    <input type="hidden" name="outcome" value="verified" />
                    <Button
                      type="submit"
                      disabled={!business.cacDocumentUrl || business.verificationStatus === 'verified'}
                      className="h-10 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <BadgeCheck aria-hidden className="mr-2 h-4 w-4" />
                      {business.verificationStatus === 'verified' ? 'Verified' : 'Verify business'}
                    </Button>
                  </form>
                  <form action={reviewBusinessAction} className="space-y-2">
                    <input type="hidden" name="business_id" value={business.id} />
                    <input type="hidden" name="redirect_to" value={currentPath} />
                    <input type="hidden" name="outcome" value="rejected" />
                    <label htmlFor={`note-${business.id}`} className="text-xs font-medium text-slate-700">
                      Reason for rejection (sent to the business)
                    </label>
                    <Textarea
                      id={`note-${business.id}`}
                      name="note"
                      required
                      rows={3}
                      maxLength={1000}
                      placeholder="e.g. The CAC number on the certificate does not match RC 1234567."
                      className="bg-white text-sm"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      className="h-10 w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <XCircle aria-hidden className="mr-2 h-4 w-4" />
                      Reject with reason
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
