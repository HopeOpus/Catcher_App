import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CreditCard,
  Package,
  Shield,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdminPageAccess } from '@/lib/admin-access';
import { prisma } from '@/lib/prisma';
import {
  AdminPageHeader,
  AdminPageNotice,
  formatAdminDateTime,
  getAdminPageNotice,
  type AdminPageSearchParams,
} from './admin-page-utils';

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams?: AdminPageSearchParams;
}) {
  const adminUser = await requireAdminPageAccess();
  const notice = await getAdminPageNotice(searchParams);

  const [
    totalUsers,
    adminUsers,
    totalProperties,
    archivedProperties,
    openReports,
    activeSubscriptions,
    catalogCount,
    recentPaymentEvents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { role: 'Admin' },
    }),
    prisma.property.count(),
    prisma.property.count({
      where: {
        archivedAt: { not: null },
      },
    }),
    prisma.stolenReport.count({
      where: {
        status: { not: 'Resolved' },
      },
    }),
    prisma.propertyCoverage.count({
      where: {
        status: {
          in: ['active', 'grace', 'scheduled'],
        },
      },
    }),
    prisma.preRegisteredProperty.count(),
    prisma.paymentEventLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        reference: true,
        source: true,
        processingOutcome: true,
        transactionStatus: true,
        createdAt: true,
      },
    }),
  ]);

  const stats = [
    {
      title: 'Users',
      value: totalUsers.toString(),
      icon: Users,
      tone: 'bg-[#36689e]/10 text-[#36689e]',
    },
    {
      title: 'Admins',
      value: adminUsers.toString(),
      icon: Shield,
      tone: 'bg-green-100 text-green-700',
    },
    {
      title: 'Properties',
      value: totalProperties.toString(),
      icon: Building2,
      tone: 'bg-blue-100 text-blue-700',
    },
    {
      title: 'Open Reports',
      value: openReports.toString(),
      icon: AlertTriangle,
      tone: 'bg-red-100 text-red-700',
    },
    {
      title: 'Active Subscriptions',
      value: activeSubscriptions.toString(),
      icon: CreditCard,
      tone: 'bg-amber-100 text-amber-700',
    },
    {
      title: 'Catalog Items',
      value: catalogCount.toString(),
      icon: Package,
      tone: 'bg-slate-200 text-slate-700',
    },
  ];

  const shortcuts = [
    {
      title: 'Manage Users',
      description: 'Review accounts and promote or demote admin access.',
      href: '/admin/users',
    },
    {
      title: 'Manage Properties',
      description: 'Edit, archive, restore, or delete registered properties.',
      href: '/admin/properties',
    },
    {
      title: 'Manage Reports',
      description: 'Update stolen report status or remove incorrect reports.',
      href: '/admin/stolen-reports',
    },
    {
      title: 'Manage Catalog',
      description: 'Maintain the public pre-registered property catalog.',
      href: '/admin/catalog',
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Admin Overview"
        description="Monitor the whole Catcher system, jump into core management screens, and keep platform data clean and secure."
        actionHref="/dashboard"
        actionLabel="Back to User Dashboard"
      />

      <AdminPageNotice notice={notice} />

      <Card className="border-[#36689e]/20 bg-[#36689e]/5">
        <CardContent className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#36689e]">
              Signed In As Admin
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#0F2651]">{adminUser.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{adminUser.email}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-[#0F2651] text-white">Role: Admin</Badge>
            <Badge className="bg-white text-slate-700">Archived properties: {archivedProperties}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.title} className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-8 w-8 rounded-full p-2 ${stat.tone}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#0F2651]">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0F2651]">Admin Shortcuts</CardTitle>
            <CardDescription>Jump straight into the management screens you will use most.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.href}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#36689e]/40"
              >
                <h3 className="text-lg font-semibold text-[#0F2651]">{shortcut.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{shortcut.description}</p>
                <Button asChild variant="ghost" className="mt-4 px-0 text-[#36689e]">
                  <Link href={shortcut.href}>
                    Open
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#0F2651]">Recent Payment Activity</CardTitle>
            <CardDescription>Latest payment events recorded by the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentPaymentEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-600">
                No payment events have been recorded yet.
              </div>
            ) : (
              recentPaymentEvents.map((event) => (
                <div key={event.id} className="rounded-xl border border-slate-200 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#0F2651]">
                      {event.processingOutcome ?? 'No outcome'}
                    </p>
                    <Badge className="bg-slate-100 text-slate-700">{event.source}</Badge>
                  </div>
                  <p className="mt-2 break-all text-xs text-slate-500">
                    {event.reference ?? 'No reference'}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Status: {event.transactionStatus ?? 'Not available'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatAdminDateTime(event.createdAt)}
                  </p>
                </div>
              ))
            )}
            <Button asChild variant="outline" className="w-full border-[#36689e] text-[#0F2651]">
              <Link href="/admin/payments">View payment logs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

