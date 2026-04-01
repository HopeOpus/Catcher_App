import { redirect } from 'next/navigation';
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from '@/lib/authenticated-user';
import { prisma } from '@/lib/prisma';
import NotificationsPageClient, {
  type DashboardNotificationItem,
} from './notifications-page-client';

async function getNotifications(userId: string): Promise<DashboardNotificationItem[]> {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
    },
    include: {
      property: {
        select: {
          name: true,
        },
      },
      coverage: {
        select: {
          planName: true,
        },
      },
      stolenReport: {
        select: {
          status: true,
        },
      },
      paymentEventLog: {
        select: {
          reference: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  return notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    linkPath: notification.linkPath,
    status: notification.status,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
    propertyName: notification.property?.name ?? null,
    planName: notification.coverage?.planName ?? null,
    stolenReportStatus: notification.stolenReport?.status ?? null,
    paymentReference: notification.paymentEventLog?.reference ?? null,
  }));
}

export default async function NotificationsPage() {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    redirect('/auth/signin');
  }

  await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
  const notifications = await getNotifications(authenticatedUser.userId);

  return <NotificationsPageClient notifications={notifications} />;
}
