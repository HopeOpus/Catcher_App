import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type NotificationFeedStatus = "all" | "unread" | "read" | "archived";

type NotificationFeedClient =
  | Pick<PrismaClient, "notification">
  | Pick<Prisma.TransactionClient, "notification">;

function normalizeNotificationStatus(value: string | null | undefined): NotificationFeedStatus {
  if (value === "unread" || value === "read" || value === "archived") {
    return value;
  }

  return "all";
}

function buildNotificationWhere(
  userId: string,
  status?: string | null,
): Prisma.NotificationWhereInput {
  const normalizedStatus = normalizeNotificationStatus(status);

  return {
    userId,
    ...(normalizedStatus === "all" ? {} : { status: normalizedStatus }),
  };
}

export async function listNotificationsForUser(
  userId: string,
  params?: {
    limit?: number;
    offset?: number;
    status?: string | null;
  },
  db: NotificationFeedClient = prisma,
) {
  const limit = Math.min(Math.max(params?.limit ?? 20, 1), 100);
  const offset = Math.max(params?.offset ?? 0, 0);
  const where = buildNotificationWhere(userId, params?.status);
  const unreadWhere = buildNotificationWhere(userId, "unread");

  const [count, unreadCount, notifications] = await Promise.all([
    db.notification.count({ where }),
    db.notification.count({ where: unreadWhere }),
    db.notification.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        coverage: {
          select: {
            id: true,
            planName: true,
          },
        },
        stolenReport: {
          select: {
            id: true,
            status: true,
          },
        },
        paymentEventLog: {
          select: {
            id: true,
            reference: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: offset,
      take: limit,
    }),
  ]);

  return {
    data: notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      linkPath: notification.linkPath,
      status: notification.status,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString() ?? null,
      archivedAt: notification.archivedAt?.toISOString() ?? null,
      propertyId: notification.propertyId,
      coverageId: notification.coverageId,
      stolenReportId: notification.stolenReportId,
      paymentEventLogId: notification.paymentEventLogId,
      propertyName: notification.property?.name ?? null,
      planName: notification.coverage?.planName ?? null,
      paymentReference: notification.paymentEventLog?.reference ?? null,
      payload: notification.payload,
    })),
    count,
    unreadCount,
    next: offset + Math.min(limit, Math.max(count - offset, 0)) < count ? String(offset + limit) : "",
    previous: offset > 0 ? String(Math.max(offset - limit, 0)) : "",
  };
}
