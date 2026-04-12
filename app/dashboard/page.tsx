import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  CreditCard,
  Plus,
  ReceiptText,
  ShieldCheck,
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
  resolveAuthenticatedAppUserRole,
  syncAuthenticatedAppUserRecord,
} from '@/lib/authenticated-user';
import {
  getCoverageDisplayState,
  getCurrentAndUpcomingCoverage,
} from '@/lib/property-coverage';
import { syncPropertyLifecycle } from '@/lib/property-lifecycle';
import { prisma } from '@/lib/prisma';

function getPropertyStatusColor(status: string) {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Flagged':
      return 'bg-yellow-100 text-yellow-800';
    case 'Stolen':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

export default async function DashboardPage() {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    redirect('/auth/signin');
  }

  await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

  const currentUserRecord = await prisma.user.findUnique({
    where: { id: authenticatedUser.userId },
    select: {
      role: true,
    },
  });
  const isAdminUser =
    resolveAuthenticatedAppUserRole(authenticatedUser, currentUserRecord?.role ?? null) ===
    'Admin';

  if (isAdminUser) {
    redirect('/admin');
  }

  await syncPropertyLifecycle(prisma, {
    userId: authenticatedUser.userId,
  });

  const [properties, openReports, freePlanUsageCount] = await Promise.all([
    prisma.property.findMany({
      where: { userId: authenticatedUser.userId },
      include: {
        coverages: {
          orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.stolenReport.count({
      where: {
        userId: authenticatedUser.userId,
        status: { not: 'Resolved' },
        property: {
          archivedAt: null,
        },
      },
    }),
    prisma.propertyCoverage.count({
      where: {
        userId: authenticatedUser.userId,
        planCode: 'free',
      },
    }),
  ]);

  const hasUsedFreePlan = freePlanUsageCount > 0;

  const propertyCoverageSnapshots = properties.map((property) => {
    const { currentCoverage, upcomingCoverage } = getCurrentAndUpcomingCoverage(
      property.coverages,
    );
    const displayState = getCoverageDisplayState({
      coverage: currentCoverage,
      propertyArchivedAt: property.archivedAt,
    });

    return {
      property,
      currentCoverage,
      upcomingCoverage,
      displayState,
    };
  });

  const totalProperties = properties.length;
  const activeProperties = properties.filter(
    (property) => property.status === 'Active' && property.archivedAt === null,
  ).length;
  const activePlans = propertyCoverageSnapshots.filter(
    ({ displayState }) => displayState.isActive || displayState.isInGrace,
  ).length;
  const recentProperties = propertyCoverageSnapshots
    .filter(({ property }) => property.archivedAt === null)
    .slice(0, 4)
    .map(({ property }) => property);

  const renewalAttention = propertyCoverageSnapshots
    .filter(({ currentCoverage, displayState }) => {
      if (!currentCoverage?.expiresAt || displayState.isArchived) {
        return false;
      }
      
      return true;
    })
    .sort((left, right) => {
      const leftExpiry = left.currentCoverage?.expiresAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightExpiry =
        right.currentCoverage?.expiresAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

      return leftExpiry - rightExpiry;
    })[0];

  const alerts = [
    openReports > 0
      ? {
          title: `${openReports} open stolen ${openReports === 1 ? 'report' : 'reports'}`,
          description:
            'You still have active theft cases that may need follow-up information or tracking.',
          tone: 'red',
          href: '/dashboard/stolen-reports',
          action: 'Review reports',
        }
      : null,
    renewalAttention
      ? renewalAttention.displayState.isInGrace
        ? {
            title: `${renewalAttention.property.name} is in its grace window`,
            description: `Renew before ${formatDate(
              renewalAttention.currentCoverage?.graceEndsAt ?? new Date(),
            )} to restore or keep the property live on Catcher.`,
            tone: 'yellow',
            href: '/dashboard/subscriptions',
            action: 'Manage property plan',
          }
        : {
            title: `${renewalAttention.property.name} is due for renewal soon`,
            description: `Coverage is active through ${formatDate(
              renewalAttention.currentCoverage?.expiresAt ?? new Date(),
            )}. Renew early to extend from that expiry date.`,
            tone: 'yellow',
            href: '/dashboard/subscriptions',
            action: 'Review billing',
          }
      : null,
    totalProperties === 0
      ? {
          title: 'No properties registered yet',
          description:
            'Add your first property so Catcher can start tracking and protecting it.',
          tone: 'blue',
          href: '/dashboard/properties',
          action: 'Add your first property',
        }
      : null,
  ].filter(Boolean) as Array<{
    title: string;
    description: string;
    tone: 'red' | 'yellow' | 'blue';
    href: string;
    action: string;
  }>;

  const stats = [
    {
      title: 'Registered Properties',
      value: totalProperties.toString(),
      icon: Building2,
      color: 'text-[#36689e]',
      bg: 'bg-[#36689e]/10',
    },
    {
      title: 'Active Properties',
      value: activeProperties.toString(),
      icon: ShieldCheck,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Open Stolen Reports',
      value: openReports.toString(),
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      title: 'Active Plans',
      value: activePlans.toString(),
      icon: CreditCard,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-[#0F2651]">Dashboard</h1>
          <p className="max-w-2xl text-gray-600">
            Welcome back, {authenticatedUser.name}. Here&apos;s a live overview of the
            properties, active protection plans, and theft activity tied to your account.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {isAdminUser ? (
            <Button asChild variant="outline" className="border-[#0F2651] text-[#0F2651]">
              <Link href="/admin">Open Admin Panel</Link>
            </Button>
          ) : null}
          <Button asChild className="bg-[#36689e] text-white hover:bg-[#0F2651]">
            <Link href="/dashboard/properties">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.title} className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-8 w-8 rounded-full p-2 ${stat.color} ${stat.bg}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#0F2651]">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card
        className={
          hasUsedFreePlan
            ? 'border-amber-200 bg-amber-50'
            : 'border-green-200 bg-green-50'
        }
      >
        <CardContent className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-[#0F2651]">Free Upload Status</h2>
              <Badge
                className={
                  hasUsedFreePlan
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-green-100 text-green-800'
                }
              >
                {hasUsedFreePlan ? 'Used' : 'Available'}
              </Badge>
            </div>
            <p className="max-w-3xl text-sm text-slate-700">
              {hasUsedFreePlan
                ? 'Your one free property upload has already been used. New property uploads now require the Monthly or Yearly subscription.'
                : 'Your account still has one free property upload available. You can use it on your next property registration.'}
            </p>
          </div>
          <Button
            asChild
            variant={hasUsedFreePlan ? 'outline' : 'default'}
            className={
              hasUsedFreePlan
                ? 'border-[#36689e] text-[#0F2651]'
                : 'bg-[#36689e] text-white hover:bg-[#0F2651]'
            }
          >
            <Link href={hasUsedFreePlan ? '/dashboard/subscriptions' : '/dashboard/properties'}>
              {hasUsedFreePlan ? 'Review Subscriptions' : 'Use Free Upload'}
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-[#0F2651]">Recent Properties</CardTitle>
              <CardDescription>Your latest registered items</CardDescription>
            </div>
            <Button asChild variant="outline" className="border-[#36689e] text-[#0F2651]">
              <Link href="/dashboard/properties">View all properties</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentProperties.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center">
                <Building2 className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                <h3 className="mb-2 text-lg font-semibold text-[#0F2651]">
                  No properties yet
                </h3>
                <p className="mx-auto mb-5 max-w-xl text-sm text-gray-600">
                  Register your first property to start tracking ownership and theft
                  protection.
                </p>
                <Button asChild className="bg-[#36689e] text-white hover:bg-[#0F2651]">
                  <Link href="/dashboard/properties">
                    <Plus className="mr-2 h-4 w-4" />
                    Register a property
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="truncate text-lg font-semibold text-[#0F2651]">
                          {property.name}
                        </h3>
                        <Badge className={getPropertyStatusColor(property.status)}>
                          {property.status}
                        </Badge>
                      </div>
                      <p className="mt-2 break-all text-sm text-gray-600">
                        {property.type} · {property.serialNumber}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Registered {formatDate(property.dateRegistered)}
                      </p>
                    </div>
                    <Button asChild variant="ghost" className="justify-start text-[#36689e]">
                      <Link href={`/dashboard/properties/${encodeURIComponent(property.id)}`}>
                        Manage
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Alerts & Next Steps</CardTitle>
              <CardDescription>Items that may need your attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {alerts.length === 0 ? (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-5">
                  <h3 className="font-semibold text-green-800">Everything looks healthy</h3>
                  <p className="mt-1 text-sm text-green-700">
                    Your account has no urgent alerts right now.
                  </p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const toneClasses =
                    alert.tone === 'red'
                      ? 'border-red-200 bg-red-50 text-red-800'
                      : alert.tone === 'yellow'
                        ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
                        : 'border-blue-200 bg-blue-50 text-blue-800';

                  return (
                    <div key={alert.title} className={`rounded-xl border px-4 py-5 ${toneClasses}`}>
                      <h3 className="font-semibold">{alert.title}</h3>
                      <p className="mt-1 text-sm opacity-90">{alert.description}</p>
                      <Button asChild variant="ghost" className="mt-3 h-auto p-0 text-inherit">
                        <Link href={alert.href}>
                          {alert.action}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Quick Actions</CardTitle>
              <CardDescription>Shortcuts to your main workflows</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button asChild className="w-full bg-[#36689e] text-white hover:bg-[#0F2651]">
                <Link href="/dashboard/properties">Manage Properties</Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-[#36689e] text-[#0F2651]">
                <Link href="/dashboard/stolen-reports">Review Stolen Reports</Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-[#36689e] text-[#0F2651]">
                <Link href="/dashboard/subscriptions">Manage Subscription</Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-[#36689e] text-[#0F2651]">
                <Link href="/dashboard/receipts">
                  <ReceiptText className="mr-2 h-4 w-4" />
                  Billing History
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-[#36689e] text-[#0F2651]">
                <Link href="/dashboard/notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </Link>
              </Button>
              {isAdminUser ? (
                <Button asChild variant="outline" className="w-full border-[#0F2651] text-[#0F2651]">
                  <Link href="/admin">Open Admin Panel</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" className="w-full border-[#36689e] text-[#0F2651]">
                <Link href="/dashboard/properties">Add New Property</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
