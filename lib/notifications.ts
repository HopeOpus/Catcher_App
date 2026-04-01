import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { NotificationStatus, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type NotificationWriteClient =
  | Pick<PrismaClient, "notification">
  | Pick<Prisma.TransactionClient, "notification">;

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkPath?: string | null;
  propertyId?: string | null;
  coverageId?: string | null;
  stolenReportId?: string | null;
  paymentEventLogId?: string | null;
  payload?: Prisma.InputJsonValue | null;
};

export async function createNotification(
  input: CreateNotificationInput,
  db: NotificationWriteClient = prisma,
) {
  return db.notification.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      linkPath: input.linkPath ?? null,
      propertyId: input.propertyId ?? null,
      coverageId: input.coverageId ?? null,
      stolenReportId: input.stolenReportId ?? null,
      paymentEventLogId: input.paymentEventLogId ?? null,
      payload:
        input.payload === undefined
          ? undefined
          : input.payload === null
            ? Prisma.JsonNull
            : input.payload,
    },
  });
}

export async function createNotifications(
  inputs: CreateNotificationInput[],
  db: NotificationWriteClient = prisma,
) {
  return Promise.all(inputs.map((input) => createNotification(input, db)));
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
  db: NotificationWriteClient = prisma,
) {
  const notification = await db.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!notification) {
    throw new Error("Notification not found.");
  }

  return db.notification.update({
    where: { id: notification.id },
    data: {
      status: NotificationStatus.read,
      readAt: new Date(),
      archivedAt: null,
    },
  });
}

export async function archiveNotification(
  notificationId: string,
  userId: string,
  db: NotificationWriteClient = prisma,
) {
  const notification = await db.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!notification) {
    throw new Error("Notification not found.");
  }

  return db.notification.update({
    where: { id: notification.id },
    data: {
      status: NotificationStatus.archived,
      archivedAt: new Date(),
    },
  });
}

export async function safeCreateNotification(
  input: CreateNotificationInput,
  db: NotificationWriteClient = prisma,
) {
  try {
    return await createNotification(input, db);
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
