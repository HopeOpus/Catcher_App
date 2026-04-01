import { requireAdminPageAccess } from '@/lib/admin-access';
import { prisma } from '@/lib/prisma';
import type { AdminAuditLogItem } from '@/components/admin/admin-audit-log-list';
import {
  AdminPageHeader,
  AdminPageNotice,
  getAdminPageNotice,
  type AdminPageSearchParams,
} from '../admin-page-utils';
import { AdminPaymentsPanel } from './admin-payments-panel';

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams?: AdminPageSearchParams;
}) {
  await requireAdminPageAccess();
  const notice = await getAdminPageNotice(searchParams);

  const [recentEvents, recentCoverages, auditLogs] = await Promise.all([
    prisma.paymentEventLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.propertyCoverage.findMany({
      include: {
        property: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.auditLog.findMany({
      where: {
        entityType: 'PaymentEvent',
      },
      include: {
        actor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    }),
  ]);

  const auditLogsByEventId = auditLogs.reduce<Record<string, AdminAuditLogItem[]>>(
    (accumulator, log) => {
      const key = log.entityId;

      accumulator[key] ??= [];
      accumulator[key].push({
        id: log.id,
        action: log.action,
        summary: log.summary,
        entityType: log.entityType,
        entityLabel: log.entityLabel,
        actorName: log.actor?.name ?? null,
        actorEmail: log.actor?.email ?? null,
        createdAt: log.createdAt.toISOString(),
      });

      return accumulator;
    },
    {},
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Payments"
        description="Review recent Paystack event logs and the latest property subscription records."
      />
      <AdminPageNotice notice={notice} />
      <AdminPaymentsPanel
        recentEvents={recentEvents.map((event) => ({
          id: event.id,
          provider: event.provider,
          source: event.source,
          processingOutcome: event.processingOutcome,
          transactionStatus: event.transactionStatus,
          reference: event.reference,
          providerEventType: event.providerEventType,
          providerEnvironment: event.providerEnvironment,
          errorMessage: event.errorMessage,
          signatureValid: event.signatureValid,
          amountKobo: event.amountKobo,
          currency: event.currency,
          checkoutSessionId: event.checkoutSessionId,
          propertyId: event.propertyId,
          coverageId: event.coverageId,
          createdAt: event.createdAt.toISOString(),
          processedAt: event.processedAt?.toISOString() ?? null,
        }))}
        recentCoverages={recentCoverages.map((coverage) => ({
          id: coverage.id,
          planName: coverage.planName,
          status: coverage.status,
          propertyName: coverage.property.name,
          userName: coverage.user.name,
          userEmail: coverage.user.email,
          startsAt: coverage.startsAt.toISOString(),
          expiresAt: coverage.expiresAt?.toISOString() ?? null,
        }))}
        auditLogsByEventId={auditLogsByEventId}
      />
    </div>
  );
}
