'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  Search,
  ShieldAlert,
} from 'lucide-react';
import {
  archiveNotificationAction,
  markAllNotificationsReadAction,
  markNotificationAsReadAction,
} from './actions';
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

type NotificationStatusFilter = 'all' | 'unread' | 'read' | 'archived';
type NotificationTypeFilter =
  | 'all'
  | 'PaymentReceived'
  | 'PaymentFailed'
  | 'CoverageExpiring'
  | 'GraceStarted'
  | 'PropertyArchived'
  | 'PropertyRestored'
  | 'StolenReportUpdated';

export type DashboardNotificationItem = {
  id: string;
  type: NotificationTypeFilter;
  title: string;
  message: string;
  linkPath: string | null;
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  readAt: string | null;
  propertyName: string | null;
  planName: string | null;
  stolenReportStatus: string | null;
  paymentReference: string | null;
};

type NotificationsPageClientProps = {
  notifications: DashboardNotificationItem[];
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function getNotificationIcon(type: DashboardNotificationItem['type']) {
  switch (type) {
    case 'PaymentReceived':
      return CreditCard;
    case 'PaymentFailed':
      return AlertCircle;
    case 'CoverageExpiring':
    case 'GraceStarted':
      return Clock3;
    case 'PropertyArchived':
    case 'PropertyRestored':
      return CheckCircle2;
    case 'StolenReportUpdated':
      return ShieldAlert;
    default:
      return Bell;
  }
}

function getTypeLabel(type: DashboardNotificationItem['type']) {
  switch (type) {
    case 'PaymentReceived':
      return 'Payment Received';
    case 'PaymentFailed':
      return 'Payment Failed';
    case 'CoverageExpiring':
      return 'Subscription Expiring';
    case 'GraceStarted':
      return 'Grace Started';
    case 'PropertyArchived':
      return 'Property Archived';
    case 'PropertyRestored':
      return 'Property Restored';
    case 'StolenReportUpdated':
      return 'Stolen Report Updated';
    default:
      return type;
  }
}

function getTypeTone(type: DashboardNotificationItem['type']) {
  switch (type) {
    case 'PaymentReceived':
    case 'PropertyRestored':
      return 'bg-green-100 text-green-800';
    case 'PaymentFailed':
    case 'PropertyArchived':
      return 'bg-red-100 text-red-800';
    case 'CoverageExpiring':
    case 'GraceStarted':
      return 'bg-amber-100 text-amber-800';
    case 'StolenReportUpdated':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function getStatusTone(status: DashboardNotificationItem['status']) {
  switch (status) {
    case 'unread':
      return 'bg-[#36689e]/10 text-[#0F2651]';
    case 'read':
      return 'bg-slate-100 text-slate-700';
    case 'archived':
      return 'bg-slate-200 text-slate-600';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function NotificationsPageClient({
  notifications,
}: NotificationsPageClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<NotificationStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationTypeFilter>('all');

  const filteredNotifications = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return notifications.filter((notification) => {
      if (statusFilter !== 'all' && notification.status !== statusFilter) {
        return false;
      }

      if (typeFilter !== 'all' && notification.type !== typeFilter) {
        return false;
      }

      if (!normalizedSearchTerm) {
        return true;
      }

      const haystack = [
        notification.title,
        notification.message,
        notification.propertyName,
        notification.planName,
        notification.paymentReference,
        notification.stolenReportStatus,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearchTerm);
    });
  }, [notifications, searchTerm, statusFilter, typeFilter]);

  const unreadCount = notifications.filter(
    (notification) => notification.status === 'unread',
  ).length;

  const summaryCards = [
    {
      label: 'Total Alerts',
      value: notifications.length,
    },
    {
      label: 'Unread',
      value: unreadCount,
    },
    {
      label: 'Archived',
      value: notifications.filter(
        (notification) => notification.status === 'archived',
      ).length,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F2651]">Notifications</h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            Review payment confirmations, subscription alerts, archive updates,
            and stolen-report activity in one place.
          </p>
        </div>
        <form action={markAllNotificationsReadAction}>
          <Button
            type="submit"
            variant="outline"
            className="border-[#36689e] text-[#0F2651]"
            disabled={unreadCount === 0}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        </form>
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
            Search by property, reference, plan, or message text.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_220px_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search notifications"
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as NotificationStatusFilter)
            }
            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <option value="all">All statuses</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as NotificationTypeFilter)
            }
            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <option value="all">All types</option>
            <option value="PaymentReceived">Payment received</option>
            <option value="PaymentFailed">Payment failed</option>
            <option value="CoverageExpiring">Subscription expiring</option>
            <option value="GraceStarted">Grace started</option>
            <option value="PropertyArchived">Property archived</option>
            <option value="PropertyRestored">Property restored</option>
            <option value="StolenReportUpdated">Stolen report updated</option>
          </select>
        </CardContent>
      </Card>

      {filteredNotifications.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-300">
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto mb-4 h-10 w-10 text-slate-400" />
            <h2 className="text-xl font-semibold text-[#0F2651]">
              No notifications found
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              You do not have any matching alerts yet. As your property plans
              and reports change, they will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);

            return (
              <Card
                key={notification.id}
                className={
                  notification.status === 'unread'
                    ? 'border-[#36689e]/30 shadow-sm'
                    : ''
                }
              >
                <CardContent className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <Icon className="h-5 w-5 text-[#0F2651]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-[#0F2651]">
                          {notification.title}
                        </h2>
                        <Badge className={getTypeTone(notification.type)}>
                          {getTypeLabel(notification.type)}
                        </Badge>
                        <Badge className={getStatusTone(notification.status)}>
                          {notification.status}
                        </Badge>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {notification.message}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>{formatDateTime(notification.createdAt)}</span>
                        {notification.propertyName ? (
                          <span>Property: {notification.propertyName}</span>
                        ) : null}
                        {notification.planName ? (
                          <span>Plan: {notification.planName}</span>
                        ) : null}
                        {notification.paymentReference ? (
                          <span>
                            Reference: {notification.paymentReference}
                          </span>
                        ) : null}
                        {notification.stolenReportStatus ? (
                          <span>Status: {notification.stolenReportStatus}</span>
                        ) : null}
                      </div>
                      {notification.linkPath ? (
                        <div className="mt-4">
                          <Button
                            asChild
                            variant="outline"
                            className="border-[#36689e] text-[#0F2651]"
                          >
                            <Link href={notification.linkPath}>
                              Open related page
                            </Link>
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    {notification.status === 'unread' ? (
                      <form action={markNotificationAsReadAction}>
                        <input
                          type="hidden"
                          name="notification_id"
                          value={notification.id}
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          className="w-full border-[#36689e] text-[#0F2651]"
                        >
                          Mark as read
                        </Button>
                      </form>
                    ) : null}
                    {notification.status !== 'archived' ? (
                      <form action={archiveNotificationAction}>
                        <input
                          type="hidden"
                          name="notification_id"
                          value={notification.id}
                        />
                        <Button
                          type="submit"
                          variant="ghost"
                          className="w-full text-slate-600 hover:text-[#0F2651]"
                        >
                          Archive
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
