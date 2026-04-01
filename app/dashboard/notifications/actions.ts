'use server';

import { revalidatePath } from 'next/cache';
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from '@/lib/authenticated-user';
import { archiveNotification, markNotificationAsRead } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';

async function requireNotificationUser() {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    throw new Error('Unauthorized');
  }

  await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
  return authenticatedUser;
}

function revalidateNotificationViews() {
  [
    '/dashboard',
    '/dashboard/notifications',
    '/dashboard/properties',
    '/dashboard/stolen-reports',
    '/dashboard/subscriptions',
  ].forEach((path) => revalidatePath(path));
}

export async function markNotificationAsReadAction(formData: FormData) {
  const authenticatedUser = await requireNotificationUser();
  const notificationId = String(formData.get('notification_id') ?? '').trim();

  if (!notificationId) {
    throw new Error('notification_id is required');
  }

  await markNotificationAsRead(notificationId, authenticatedUser.userId);
  revalidateNotificationViews();
}

export async function archiveNotificationAction(formData: FormData) {
  const authenticatedUser = await requireNotificationUser();
  const notificationId = String(formData.get('notification_id') ?? '').trim();

  if (!notificationId) {
    throw new Error('notification_id is required');
  }

  await archiveNotification(notificationId, authenticatedUser.userId);
  revalidateNotificationViews();
}

export async function markAllNotificationsReadAction() {
  const authenticatedUser = await requireNotificationUser();

  await prisma.notification.updateMany({
    where: {
      userId: authenticatedUser.userId,
      status: 'unread',
    },
    data: {
      status: 'read',
      readAt: new Date(),
      archivedAt: null,
    },
  });

  revalidateNotificationViews();
}
