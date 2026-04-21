/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  MoreHorizontal,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PropertyPlanCodeValue } from '@/lib/catcher-domain';
import {
  formatNgnFromKobo,
  type PropertyPlanDefinition,
} from '@/lib/property-plans';
import type {
  ManagedPropertyBillingItem,
  PropertyPlanDashboardSummary,
} from './property-plan-types';

type PageNotice = {
  tone: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

type ActionState = {
  label: string;
  disabled: boolean;
  reason?: string;
};

const SUBSCRIPTIONS_PAGE_SIZE_OPTIONS = [5, 8, 12];

function formatDate(value: string | null) {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDisplayAmount(amountNgnKobo: number) {

  if (amountNgnKobo === 0) {
    return 'Free';
  }

  return formatNgnFromKobo(amountNgnKobo);
}

function getToneClasses(tone: ManagedPropertyBillingItem['displayState']['tone']) {
  switch (tone) {
    case 'green':
      return 'bg-green-100 text-green-800';
    case 'blue':
      return 'bg-blue-100 text-blue-800';
    case 'amber':
      return 'bg-amber-100 text-amber-800';
    case 'red':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function getNoticeClasses(tone: PageNotice['tone']) {
  switch (tone) {
    case 'success':
      return 'border-green-200 bg-green-50 text-green-800';
    case 'info':
      return 'border-blue-200 bg-blue-50 text-blue-800';
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    default:
      return 'border-red-200 bg-red-50 text-red-800';
  }
}

function getDefaultPlanCode(options: {
  property: ManagedPropertyBillingItem;
  hasUsedFreePlan: boolean;
}): PropertyPlanCodeValue {
  const { property, hasUsedFreePlan } = options;

  if (property.upcomingCoverage?.planCode) {
    return property.upcomingCoverage.planCode;
  }

  if (property.archivedAt) {
    if (property.currentCoverage?.planCode && property.currentCoverage.planCode !== 'free') {
      return property.currentCoverage.planCode;
    }

    return 'monthly';
  }

  if (!property.currentCoverage) {
    if (!property.hasAnyCoverage && !hasUsedFreePlan) {
      return 'free';
    }

    return 'monthly';
  }

  if (property.currentCoverage.planCode === 'free') {
    return 'monthly';
  }

  return property.currentCoverage.planCode;
}

function getPrimaryActionState(options: {
  property: ManagedPropertyBillingItem;
  plan: PropertyPlanDefinition;
  hasUsedFreePlan: boolean;
}): ActionState {
  const { property, plan, hasUsedFreePlan } = options;

  if (property.hasPendingCheckout) {
    return {
      label: 'Payment Pending',
      disabled: true,
      reason:
        'A payment checkout is already in progress for this property. Complete or cancel it before starting another subscription action.',
    };
  }

  if (property.upcomingCoverage) {
    return {
      label: 'Subscription Scheduled',
      disabled: true,
      reason:
        'This property already has a scheduled renewal, so another one is not needed yet.',
    };
  }

  if (plan.code === 'free') {
    if (property.currentCoverage?.planCode === 'free' && !property.archivedAt) {
      return {
        label: 'Free Plan Active',
        disabled: true,
        reason:
          'This property is already covered by the free subscription. Choose a paid subscription only if you want to upgrade coverage.',
      };
    }

    if (hasUsedFreePlan) {
      return {
        label: 'Free Plan Used',
        disabled: true,
        reason: 'Your one-time free subscription has already been used on this account.',
      };
    }

    if (property.archivedAt) {
      return {
        label: 'Paid Restore Required',
        disabled: true,
        reason: 'Archived properties can only be restored with a paid monthly or yearly subscription.',
      };
    }

    if (property.hasAnyCoverage) {
      return {
        label: 'Free Not Available',
        disabled: true,
        reason:
          "The free subscription is only available during a property's first activation.",
      };
    }

    return {
      label: 'Activate Free Subscription',
      disabled: false,
    };
  }

  if (property.archivedAt) {
    return {
      label: `Restore with ${plan.name}`,
      disabled: false,
    };
  }

  if (!property.currentCoverage) {
    return {
      label: `Start ${plan.name}`,
      disabled: false,
    };
  }

  if (property.currentCoverage.planCode === 'free') {
    return {
      label: `Upgrade to ${plan.name}`,
      disabled: false,
    };
  }

  return {
    label: `Renew with ${plan.name}`,
    disabled: false,
  };
}

function buildGraceDetail(property: ManagedPropertyBillingItem) {
  if (property.displayState.isInGrace && property.currentCoverage?.graceEndsAt) {
    return `Grace ends ${formatDate(property.currentCoverage.graceEndsAt)}`;
  }

  if (property.displayState.isArchived && property.archivedAt) {
    return `Archived ${formatDate(property.archivedAt)}`;
  }

  if (property.displayState.isScheduled && property.currentCoverage?.startsAt) {
    return `Scheduled from ${formatDate(property.currentCoverage.startsAt)}`;
  }

  if (property.currentCoverage?.expiresAt) {
    return `Coverage ends ${formatDate(property.currentCoverage.expiresAt)}`;
  }

  if (property.currentCoverage?.planCode === 'free') {
    return 'No expiry on the free plan';
  }

  return 'Choose a subscription to activate this property';
}

type SubscriptionsPageClientProps = {
  supportEmail: string;
  properties: ManagedPropertyBillingItem[];
  summary: PropertyPlanDashboardSummary;
  hasUsedFreePlan: boolean;
  planDefinitions: PropertyPlanDefinition[];
};

export default function SubscriptionsPageClient({
  supportEmail,
  properties,
  summary,
  hasUsedFreePlan,
  planDefinitions,
}: SubscriptionsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutState = searchParams.get('checkout');
  const checkoutReference = searchParams.get('reference');
  const focusedPropertyId = searchParams.get('property');
  const [selectedPlanCodesByPropertyId, setSelectedPlanCodesByPropertyId] = useState<
    Record<string, PropertyPlanCodeValue>
  >({});
  const [submittingPropertyId, setSubmittingPropertyId] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState<PageNotice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'grace' | 'scheduled' | 'archived' | 'inactive'
  >('all');
  const [planFilter, setPlanFilter] = useState<'all' | PropertyPlanCodeValue>('all');
  const [ignoreFocusedProperty, setIgnoreFocusedProperty] = useState(false);

  const getSelectedPlanForProperty = (property: ManagedPropertyBillingItem) => {
    const selectedPlanCode =
      selectedPlanCodesByPropertyId[property.propertyId] ??
      getDefaultPlanCode({
        property,
        hasUsedFreePlan,
      });

    return (
      planDefinitions.find((plan) => plan.code === selectedPlanCode) ?? planDefinitions[0]
    );
  };

  const visibleProperties = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return properties.filter((property) => {
      if (focusedPropertyId && !ignoreFocusedProperty && property.propertyId !== focusedPropertyId) {
        return false;
      }

      if (statusFilter === 'active' && !property.displayState.isActive) {
        return false;
      }

      if (statusFilter === 'grace' && !property.displayState.isInGrace) {
        return false;
      }

      if (statusFilter === 'scheduled' && !property.displayState.isScheduled) {
        return false;
      }

      if (statusFilter === 'archived' && !property.displayState.isArchived) {
        return false;
      }

      if (
        statusFilter === 'inactive' &&
        (property.displayState.isActive ||
          property.displayState.isInGrace ||
          property.displayState.isScheduled ||
          property.displayState.isArchived)
      ) {
        return false;
      }

      const effectivePlanCode =
        property.currentCoverage?.planCode ?? property.upcomingCoverage?.planCode ?? null;

      if (planFilter !== 'all' && effectivePlanCode !== planFilter) {
        return false;
      }

      if (!normalizedSearchTerm) {
        return true;
      }

      return [
        property.propertyName,
        property.propertyType,
        property.serialNumber,
        property.currentCoverage?.planName,
        property.currentCoverage?.status,
        property.archiveReason,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearchTerm);
    });
  }, [
    focusedPropertyId,
    ignoreFocusedProperty,
    planFilter,
    properties,
    searchTerm,
    statusFilter,
  ]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    focusedPropertyId,
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  useEffect(() => {
    setPagination((current) => ({
      ...current,
      pageIndex: 0,
    }));
  }, [searchTerm, statusFilter, planFilter, focusedPropertyId, ignoreFocusedProperty]);

  useEffect(() => {
    if (!visibleProperties.length) {
      setSelectedPropertyId(null);
      return;
    }

    if (
      focusedPropertyId &&
      !ignoreFocusedProperty &&
      visibleProperties.some((property) => property.propertyId === focusedPropertyId)
    ) {
      setSelectedPropertyId(focusedPropertyId);
      return;
    }

    if (
      !selectedPropertyId ||
      !visibleProperties.some((property) => property.propertyId === selectedPropertyId)
    ) {
      setSelectedPropertyId(visibleProperties[0]?.propertyId ?? null);
    }
  }, [focusedPropertyId, ignoreFocusedProperty, selectedPropertyId, visibleProperties]);

  const selectedProperty =
    visibleProperties.find((property) => property.propertyId === selectedPropertyId) ?? null;

  const subscriptionColumns = useMemo<ColumnDef<ManagedPropertyBillingItem>[]>(
    () => [
      {
        accessorKey: 'propertyName',
        header: 'Property',
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-semibold text-[#0F2651]">{row.original.propertyName}</p>
            <p className="text-xs text-slate-500">
              {row.original.propertyType} · {row.original.serialNumber}
            </p>
          </div>
        ),
      },
      {
        id: 'state',
        header: 'Status',
        accessorFn: (property) => property.displayState.label,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Badge className={getToneClasses(row.original.displayState.tone)}>
              {row.original.displayState.label}
            </Badge>
            <Badge className="bg-slate-100 text-slate-700">
              {row.original.propertyStatus}
            </Badge>
          </div>
        ),
      },
      {
        id: 'currentPlan',
        header: 'Current Subscription',
        accessorFn: (property) => property.currentCoverage?.planName ?? 'No active plan',
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#0F2651]">
              {row.original.currentCoverage?.planName ?? 'No active plan'}
            </p>
            <p className="text-xs text-slate-500">
              {row.original.currentCoverage?.status ?? 'Needs subscription'}
            </p>
          </div>
        ),
      },
      {
        id: 'amountPaid',
        header: 'Amount Paid',
        accessorFn: (property) => property.currentCoverage?.priceNgnKobo ?? 0,
        cell: ({ row }) => {
          const amountLabel = row.original.currentCoverage
            ? formatDisplayAmount(row.original.currentCoverage.priceNgnKobo)
            : 'Not billed yet';

          return (
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#0F2651]">{amountLabel}</p>
            </div>
          );
        },
      },
      {
        id: 'timeline',
        header: 'Timeline',
        accessorFn: (property) =>
          property.currentCoverage?.expiresAt ??
          property.currentCoverage?.startsAt ??
          property.dateRegistered,
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#0F2651]">
              {row.original.currentCoverage
                ? `Start ${formatDate(row.original.currentCoverage.startsAt)}`
                : 'Not started'}
            </p>
            <p className="text-xs text-slate-500">{buildGraceDetail(row.original)}</p>
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open property subscription actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSelectedPropertyId(row.original.propertyId)}>
                Manage Subscription
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/properties/${encodeURIComponent(row.original.propertyId)}`}
                >
                  Property Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/receipts?property=${encodeURIComponent(
                    row.original.propertyId,
                  )}`}
                >
                  Billing History
                </Link>
              </DropdownMenuItem>
              {!row.original.archivedAt ? (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/properties">Manage in Properties</Link>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  const subscriptionsTable = useReactTable({
    data: visibleProperties,
    columns: subscriptionColumns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useEffect(() => {
    const pageCount = subscriptionsTable.getPageCount();

    if (pageCount > 0 && pagination.pageIndex > pageCount - 1) {
      subscriptionsTable.setPageIndex(pageCount - 1);
    }

    if (pageCount === 0 && pagination.pageIndex !== 0) {
      subscriptionsTable.setPageIndex(0);
    }
  }, [pagination.pageIndex, subscriptionsTable, visibleProperties.length]);

  const paginatedPropertyRows = subscriptionsTable.getRowModel().rows;
  const paginatedPropertyItems = paginatedPropertyRows.map((row) => row.original);
  const selectedPlan = selectedProperty ? getSelectedPlanForProperty(selectedProperty) : null;
  const selectedActionState =
    selectedProperty && selectedPlan
      ? getPrimaryActionState({
          property: selectedProperty,
          plan: selectedPlan,
          hasUsedFreePlan,
        })
      : null;

  useEffect(() => {
    if (!checkoutState) {
      return;
    }

    switch (checkoutState) {
      case 'success':
        setPageNotice({
          tone: 'success',
          message:
            'Payment confirmed. Your property subscription has been activated and any archived property has been restored.',
        });
        break;
      case 'processing':
        setPageNotice({
          tone: 'info',
          message:
            'Your payment is still being confirmed. We will refresh this page as soon as Paystack verification finishes.',
        });
        break;
      case 'review':
        setPageNotice({
          tone: 'warning',
          message:
            'Payment was received, but it needs manual review before the property subscription can be activated.',
        });
        break;
      case 'failed':
        setPageNotice({
          tone: 'error',
          message:
            'Paystack could not confirm that payment, so the renewal or restore was not activated.',
        });
        break;
      case 'cancelled':
        setPageNotice({
          tone: 'info',
          message:
            'Payment was cancelled before completion. The property subscription was left unchanged.',
        });
        break;
      case 'error':
        setPageNotice({
          tone: 'error',
          message:
            'We could not confirm the payment callback. If you were charged, give it a moment and refresh this page.',
        });
        break;
      default:
        break;
    }
  }, [checkoutState]);

  useEffect(() => {
    if (checkoutState !== 'processing' || !checkoutReference) {
      return;
    }

    let disposed = false;
    let intervalId: number | null = null;

    const verifyCheckout = async () => {
      try {
        const response = await fetch(
          `/api/payments/paystack/verify?reference=${encodeURIComponent(checkoutReference)}`,
          { cache: 'no-store' },
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok || disposed) {
          return;
        }

        if (payload?.outcome === 'completed') {
          setPageNotice({
            tone: 'success',
            message:
              'Payment confirmed. Your property subscription is active and the latest billing details are now live.',
          });
          router.refresh();
        }

        if (payload?.outcome === 'review') {
          setPageNotice({
            tone: 'warning',
            message:
              'Payment was received, but it needs manual review before the property subscription can be activated.',
          });
        }

        if (payload?.outcome === 'failed') {
          setPageNotice({
            tone: 'error',
            message:
              'Paystack could not confirm that payment, so the renewal or restore was not activated.',
          });
        }

        if (
          payload?.outcome === 'completed' ||
          payload?.outcome === 'review' ||
          payload?.outcome === 'failed'
        ) {
          if (intervalId !== null) {
            window.clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch (error) {
        console.error('Error polling property plan verification:', error);
      }
    };

    void verifyCheckout();
    intervalId = window.setInterval(() => {
      void verifyCheckout();
    }, 5000);

    return () => {
      disposed = true;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [checkoutReference, checkoutState, router]);

  const handlePlanAction = async (
    property: ManagedPropertyBillingItem,
    plan: PropertyPlanDefinition,
  ) => {
    const actionState = getPrimaryActionState({
      property,
      plan,
      hasUsedFreePlan,
    });

    if (actionState.disabled) {
      return;
    }

    setSubmittingPropertyId(property.propertyId);
    setPageNotice(null);

    try {
      const response = await fetch('/api/property-checkout-sessions/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: property.propertyId,
          plan_code: plan.code,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.error || 'We could not start the property subscription checkout.',
        );
      }

      if (payload?.mode === 'free') {
        setPageNotice({
          tone: 'success',
          message:
            'The free subscription was activated immediately for this property. Your billing view has been refreshed.',
        });
        router.refresh();
        return;
      }

      if (payload?.mode === 'payment' && payload.authorizationUrl) {
        window.location.assign(payload.authorizationUrl);
        return;
      }

      throw new Error('Unexpected checkout response from the server.');
    } catch (error) {
      setPageNotice({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'We could not start the property subscription checkout.',
      });
    } finally {
      setSubmittingPropertyId(null);
    }
  };

  const summaryCards = [
    {
      title: 'Registered Properties',
      value: summary.totalProperties.toString(),
      icon: Shield,
      tone: 'text-[#36689e] bg-[#36689e]/10',
    },
    {
      title: 'Active Subscriptions',
      value: summary.activePlans.toString(),
      icon: CheckCircle2,
      tone: 'text-green-600 bg-green-100',
    },
    {
      title: 'In Grace Window',
      value: summary.graceWindow.toString(),
      icon: Clock3,
      tone: 'text-amber-700 bg-amber-100',
    },
    {
      title: 'Archived Properties',
      value: summary.archivedProperties.toString(),
      icon: RotateCcw,
      tone: 'text-slate-700 bg-slate-200',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F2651]">Subscriptions & Billing</h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            Manage each property subscription individually, renew early from the current
            expiry date, and restore archived properties with a paid subscription when coverage lapses.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" className="border-[#36689e] text-[#0F2651]">
            <a href={`mailto:${supportEmail}`}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Contact Billing
            </a>
          </Button>
          <Button asChild className="bg-[#36689e] text-white hover:bg-[#0F2651]">
            <Link href="/dashboard/properties">
              Upload Property
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {pageNotice ? (
        <div className={`rounded-2xl border px-4 py-4 text-sm ${getNoticeClasses(pageNotice.tone)}`}>
          {pageNotice.message}
        </div>
      ) : null}

      {focusedPropertyId && !ignoreFocusedProperty ? (
        <div className="rounded-2xl border border-[#36689e]/20 bg-[#36689e]/5 px-4 py-4 text-sm text-slate-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>
              You are viewing subscription actions for one property selected from its details page.
            </p>
            <Button
              type="button"
              variant="outline"
              className="border-[#36689e] text-[#0F2651]"
              onClick={() => setIgnoreFocusedProperty(true)}
            >
              Show All Properties
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.title} className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
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

      <Card className="border-[#36689e]/20 bg-[#36689e]/5">
        <CardHeader>
          <CardTitle className="text-[#0F2651]">Manage each property separately</CardTitle>
          <CardDescription className="mt-2 max-w-3xl text-slate-700">
            New properties are uploaded and paid for in Properties. This page is for
            existing properties only, where you choose a subscription to start, renew,
            upgrade, or restore that specific property.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
            <p className="font-semibold text-[#0F2651]">Per-property billing</p>
            <p className="mt-2">
              A subscription belongs to one property, not to the whole account. A plan
              selected on one property card affects only that property.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
            <p className="font-semibold text-[#0F2651]">Matching flow</p>
            <p className="mt-2">
              Upload in Properties, choose a subscription, and pay there. Come back here
              later to renew early, upgrade from Free, or restore an archived property.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
            <p className="font-semibold text-[#0F2651]">Global pricing</p>
            <p className="mt-2">
              Every customer pays the same fixed pricing: $1 monthly or $5 yearly for
              each property. The free plan remains available once per account.
            </p>
          </div>
        </CardContent>
      </Card>

      {properties.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0F2651]">Search & Filters</CardTitle>
            <CardDescription>
              Search by property, plan, or serial number and filter by coverage state.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_220px_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search properties or subscriptions"
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | 'all'
                    | 'active'
                    | 'grace'
                    | 'scheduled'
                    | 'archived'
                    | 'inactive',
                )
              }
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              <option value="all">All states</option>
              <option value="active">Active</option>
              <option value="grace">Grace</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
              <option value="inactive">Needs plan</option>
            </select>
            <select
              value={planFilter}
              onChange={(event) =>
                setPlanFilter(event.target.value as 'all' | PropertyPlanCodeValue)
              }
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              <option value="all">All plans</option>
              <option value="free">Free</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </CardContent>
        </Card>
      ) : null}

      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="mx-auto mb-4 h-10 w-10 text-slate-400" />
            <h2 className="text-xl font-semibold text-[#0F2651]">No properties yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
              Upload your first property, choose a subscription, and complete payment if
              needed. Once it is registered, this page will manage its subscription,
              expiry, grace window, and renewal history.
            </p>
            <Button asChild className="mt-6 bg-[#36689e] text-white hover:bg-[#0F2651]">
              <Link href="/dashboard/properties">Upload a Property</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {visibleProperties.length > 0 ? (
            <>
          <Card>
            <CardContent className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-600">
                {visibleProperties.length === 0
                  ? 'No matching property subscriptions'
                  : `Showing ${
                      subscriptionsTable.getState().pagination.pageIndex *
                        subscriptionsTable.getState().pagination.pageSize +
                      1
                    }-${Math.min(
                      visibleProperties.length,
                      subscriptionsTable.getState().pagination.pageIndex *
                        subscriptionsTable.getState().pagination.pageSize +
                        paginatedPropertyRows.length,
                    )} of ${visibleProperties.length} property subscriptions`}
              </p>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <span>Rows</span>
                <select
                  value={subscriptionsTable.getState().pagination.pageSize}
                  onChange={(event) => {
                    subscriptionsTable.setPageSize(Number(event.target.value));
                    subscriptionsTable.setPageIndex(0);
                  }}
                  className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                >
                  {SUBSCRIPTIONS_PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </CardContent>
          </Card>

          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
            <Table>
              <TableHeader className="bg-slate-50">
                {subscriptionsTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {paginatedPropertyRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={`cursor-pointer ${
                      row.original.propertyId === selectedPropertyId ? 'bg-[#36689e]/5' : ''
                    }`}
                    onClick={() => setSelectedPropertyId(row.original.propertyId)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4 md:hidden">
            {paginatedPropertyItems.map((property) => {
              const currentAmount = property.currentCoverage
                ? formatDisplayAmount(property.currentCoverage.priceNgnKobo)
                : 'Not billed yet';

              return (
                <Card key={property.propertyId}>
                  <CardContent className="space-y-4 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                          {property.photoUrl ? (
                            <img
                              src={property.photoUrl}
                              alt={property.propertyName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Shield className="h-7 w-7 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0F2651]">{property.propertyName}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {property.propertyType} · {property.serialNumber}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open property subscription actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => setSelectedPropertyId(property.propertyId)}
                          >
                            Manage Subscription
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/properties/${encodeURIComponent(
                                property.propertyId,
                              )}`}
                            >
                              Property Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/receipts?property=${encodeURIComponent(
                                property.propertyId,
                              )}`}
                            >
                              Billing History
                            </Link>
                          </DropdownMenuItem>
                          {!property.archivedAt ? (
                            <DropdownMenuItem asChild>
                              <Link href="/dashboard/properties">Manage in Properties</Link>
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getToneClasses(property.displayState.tone)}>
                        {property.displayState.label}
                      </Badge>
                      <Badge className="bg-slate-100 text-slate-700">
                        {property.propertyStatus}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Subscription
                        </p>
                        <p className="mt-1 font-medium text-[#0F2651]">
                          {property.currentCoverage?.planName ?? 'No active plan'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Amount Paid
                        </p>
                        <p className="mt-1 font-medium text-[#0F2651]">{currentAmount}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Start Date
                        </p>
                        <p className="mt-1 font-medium text-[#0F2651]">
                          {property.currentCoverage
                            ? formatDate(property.currentCoverage.startsAt)
                            : 'Not started'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Grace Status
                        </p>
                        <p className="mt-1 font-medium text-[#0F2651]">
                          {buildGraceDetail(property)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Page {subscriptionsTable.getState().pagination.pageIndex + 1} of{' '}
                {Math.max(subscriptionsTable.getPageCount(), 1)}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!subscriptionsTable.getCanPreviousPage()}
                  onClick={() => subscriptionsTable.previousPage()}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!subscriptionsTable.getCanNextPage()}
                  onClick={() => subscriptionsTable.nextPage()}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedProperty && selectedPlan && selectedActionState ? (
            <Card className="overflow-hidden border-slate-200">
              <CardHeader className="border-b border-slate-100 pb-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      {selectedProperty.photoUrl ? (
                        <img
                          src={selectedProperty.photoUrl}
                          alt={selectedProperty.propertyName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Shield className="h-10 w-10 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-xl text-[#0F2651]">
                        {selectedProperty.propertyName}
                      </CardTitle>
                      <CardDescription className="mt-2 break-all text-sm text-slate-600">
                        {selectedProperty.propertyType} · {selectedProperty.serialNumber}
                      </CardDescription>
                      <p className="mt-2 text-sm text-slate-500">
                        Registered {formatDate(selectedProperty.dateRegistered)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getToneClasses(selectedProperty.displayState.tone)}>
                      {selectedProperty.displayState.label}
                    </Badge>
                    <Badge className="bg-slate-100 text-slate-700">
                      Property {selectedProperty.propertyStatus}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 pt-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Current Subscription
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#0F2651]">
                      {selectedProperty.currentCoverage?.planName ?? 'No active plan'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount Paid
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#0F2651]">
                      {selectedProperty.currentCoverage
                        ? formatDisplayAmount(selectedProperty.currentCoverage.priceNgnKobo)
                        : 'Not billed yet'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Start Date
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#0F2651]">
                      {selectedProperty.currentCoverage
                        ? formatDate(selectedProperty.currentCoverage.startsAt)
                        : 'Not started'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Expiry Date
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#0F2651]">
                      {selectedProperty.currentCoverage
                        ? selectedProperty.currentCoverage.expiresAt
                          ? formatDate(selectedProperty.currentCoverage.expiresAt)
                          : 'No expiry'
                        : 'Not available'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Grace Status
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#0F2651]">
                      {buildGraceDetail(selectedProperty)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Selected Subscription
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#0F2651]">
                      {selectedPlan.name}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-base font-semibold text-[#0F2651]">
                        Choose a subscription for this property
                      </p>
                      <p className="mt-1 max-w-2xl text-sm text-slate-600">
                        Select the subscription you want to start, renew, upgrade, or use
                        to restore this property. The choice here applies only to{' '}
                        <span className="font-medium text-[#0F2651]">
                          {selectedProperty.propertyName}
                        </span>
                        .
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:max-w-xs">
                      <p className="font-semibold text-[#0F2651]">Charged in USD</p>
                      <p className="mt-1">
                        Monthly registrations are billed at $1 and yearly registrations
                        are billed at $5 for every property, wherever the payment is made.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                    {planDefinitions.map((plan) => {
                      const isSelected = selectedPlan.code === plan.code;
                      const previewActionState = getPrimaryActionState({
                        property: selectedProperty,
                        plan,
                        hasUsedFreePlan,
                      });

                      return (
                        <button
                          key={`${selectedProperty.propertyId}-${plan.code}`}
                          type="button"
                          onClick={() =>
                            setSelectedPlanCodesByPropertyId((current) => ({
                              ...current,
                              [selectedProperty.propertyId]: plan.code,
                            }))
                          }
                          className={`rounded-2xl border px-5 py-5 text-left transition-all ${
                            isSelected
                              ? 'border-[#36689e] bg-[#36689e]/5 shadow-sm ring-1 ring-[#36689e]/20'
                              : 'border-slate-200 bg-white hover:border-[#36689e]/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-lg font-semibold text-[#0F2651]">
                                {plan.name}
                              </p>
                              <p className="mt-1 text-sm font-medium text-slate-700">
                                {formatDisplayAmount(plan.priceNgnKobo)}
                                {plan.durationDays
                                  ? ` / ${plan.durationDays === 30 ? '30 days' : '365 days'}`
                                  : ''}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {plan.badge ? (
                                <span className="rounded-full bg-[#36689e] px-2 py-1 text-xs font-semibold text-white">
                                  {plan.badge}
                                </span>
                              ) : null}
                              {plan.code === 'free' && hasUsedFreePlan ? (
                                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                                  One-time only
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {plan.description}
                          </p>
                          <p
                            className={`mt-4 text-xs font-semibold uppercase tracking-wide ${
                              isSelected ? 'text-[#36689e]' : 'text-slate-500'
                            }`}
                          >
                            {isSelected
                              ? `Selected: ${previewActionState.label}`
                              : previewActionState.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedProperty.upcomingCoverage ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-800">
                    <p className="font-semibold">Scheduled renewal already in place</p>
                    <p className="mt-1">
                      {selectedProperty.upcomingCoverage.planName} starts on{' '}
                      {formatDate(selectedProperty.upcomingCoverage.startsAt)}
                      {selectedProperty.upcomingCoverage.expiresAt
                        ? ` and runs until ${formatDate(selectedProperty.upcomingCoverage.expiresAt)}.`
                        : '.'}
                    </p>
                  </div>
                ) : null}

                {selectedProperty.archiveReason ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                    <p className="font-semibold text-[#0F2651]">Archive reason</p>
                    <p className="mt-1">{selectedProperty.archiveReason}</p>
                  </div>
                ) : null}

                {selectedActionState.reason ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                    {selectedActionState.reason}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      disabled={
                        selectedActionState.disabled ||
                        submittingPropertyId === selectedProperty.propertyId
                      }
                      className="bg-[#36689e] text-white hover:bg-[#0F2651]"
                      onClick={() => {
                        void handlePlanAction(selectedProperty, selectedPlan);
                      }}
                    >
                      {submittingPropertyId === selectedProperty.propertyId
                        ? selectedPlan.code === 'free'
                          ? 'Activating Subscription...'
                          : 'Continuing to Payment...'
                        : selectedActionState.label}
                    </Button>
                    {selectedProperty.archivedAt ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-300 text-slate-500"
                        disabled
                      >
                        Restore to Manage Details
                      </Button>
                    ) : (
                      <Button
                        asChild
                        variant="outline"
                        className="border-[#36689e] text-[#0F2651]"
                      >
                        <Link href="/dashboard/properties">Manage in Properties</Link>
                      </Button>
                    )}
                    <Button
                      asChild
                      variant="outline"
                      className="border-[#36689e] text-[#0F2651]"
                    >
                      <Link
                        href={`/dashboard/properties/${encodeURIComponent(
                          selectedProperty.propertyId,
                        )}`}
                      >
                        Property Details
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-[#36689e] text-[#0F2651]"
                    >
                      <Link
                        href={`/dashboard/receipts?property=${encodeURIComponent(
                          selectedProperty.propertyId,
                        )}`}
                      >
                        Billing History
                      </Link>
                    </Button>
                  </div>
                  {selectedProperty.restorable && selectedProperty.archivedAt ? (
                    <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restorable after renewal
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}
            </>
          ) : null}
        </div>
      )}

      {properties.length > 0 && visibleProperties.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-300">
          <CardContent className="py-12 text-center">
            <Search className="mx-auto mb-4 h-10 w-10 text-slate-400" />
            <h2 className="text-xl font-semibold text-[#0F2651]">
              No matching subscriptions
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              Try a different search term or change one of the filters to see more property subscriptions.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-6 border-[#36689e] text-[#0F2651]"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPlanFilter('all');
                setIgnoreFocusedProperty(true);
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-[#0F2651]">Billing help</CardTitle>
          <CardDescription>
            Need an invoice, manual review follow-up, or help confirming a payment?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm text-slate-600">
            Billing support is handled through{' '}
            <span className="font-medium text-[#0F2651]">{supportEmail}</span>.
            Include the property name and payment reference if you need help with a
            renewal, restore, or verification review.
          </p>
          <Button asChild variant="outline" className="border-[#36689e] text-[#0F2651]">
            <a href={`mailto:${supportEmail}`}>
              <CreditCard className="mr-2 h-4 w-4" />
              Email Billing Support
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
