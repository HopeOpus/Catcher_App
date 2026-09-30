import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { canInScope } from '@/lib/account-scope';
import { getDashboardContext } from '@/lib/dashboard-context';
import { prisma } from '@/lib/prisma';
import BusinessProfileClient from './business-profile-client';

export const metadata: Metadata = {
  title: 'Business profile · Catcher',
};

export default async function BusinessProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ welcome?: string }>;
}) {
  const { scope } = await getDashboardContext();

  if (scope.kind !== 'business') {
    return (
      <Card className="mx-auto max-w-xl border-dashed">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#36689e]/10">
            <Briefcase aria-hidden className="h-6 w-6 text-[#36689e]" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-[#0F2651]">You are in your personal account</h1>
            <p className="mt-2 text-sm text-slate-600">
              Switch to a business from the account menu, or register your company to manage its assets and team.
            </p>
          </div>
          <Button asChild className="h-11 bg-[#0F2651] text-white hover:bg-[#36689e]">
            <Link href="/dashboard/business/register">
              <Plus aria-hidden className="mr-2 h-4 w-4" />
              Register a business
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const [business, assetCount, activeCoverageCount, memberCount] = await Promise.all([
    prisma.business.findUniqueOrThrow({ where: { id: scope.businessId } }),
    prisma.property.count({ where: { businessId: scope.businessId, archivedAt: null } }),
    prisma.propertyCoverage.count({
      where: { businessId: scope.businessId, status: { in: ['active', 'grace'] } },
    }),
    prisma.businessMember.count({ where: { businessId: scope.businessId } }),
  ]);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <BusinessProfileClient
      isWelcome={resolvedSearchParams?.welcome === '1'}
      canEdit={canInScope(scope, 'editBusiness')}
      role={scope.role}
      stats={{ assetCount, activeCoverageCount, memberCount }}
      business={{
        name: business.name,
        slug: business.slug,
        businessType: business.businessType,
        registrationNumber: business.registrationNumber,
        taxId: business.taxId ?? '',
        industry: business.industry,
        email: business.email,
        phoneNumber: business.phoneNumber,
        website: business.website ?? '',
        addressLine: business.addressLine,
        city: business.city,
        state: business.state,
        logoUrl: business.logoUrl,
        cacDocumentUrl: business.cacDocumentUrl,
        verificationStatus: business.verificationStatus,
        verificationNote: business.verificationNote,
        submittedAt: business.submittedAt?.toISOString() ?? null,
        verifiedAt: business.verifiedAt?.toISOString() ?? null,
        createdAt: business.createdAt.toISOString(),
      }}
    />
  );
}
