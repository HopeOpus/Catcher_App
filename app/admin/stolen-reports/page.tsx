import { prisma } from '@/lib/prisma';
import { requireAdminPageAccess } from '@/lib/admin-access';
import type { AdminAuditLogItem } from '@/components/admin/admin-audit-log-list';
import type { AdminNoteItem } from '@/components/admin/admin-notes-panel';
import {
  AdminPageHeader,
  AdminPageNotice,
  getAdminPageNotice,
  type AdminPageSearchParams,
} from '../admin-page-utils';
import { AdminStolenReportsTable } from './admin-stolen-reports-table';

export default async function AdminStolenReportsPage({
  searchParams,
}: {
  searchParams?: AdminPageSearchParams;
}) {
  await requireAdminPageAccess();
  const notice = await getAdminPageNotice(searchParams);

  const [reports, notes, auditLogs] = await Promise.all([
    prisma.stolenReport.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            archivedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.adminNote.findMany({
      where: {
        targetType: 'StolenReport',
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
      take: 300,
    }),
    prisma.auditLog.findMany({
      where: {
        entityType: 'StolenReport',
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
      take: 400,
    }),
  ]);

  const notesByReportId = notes.reduce<Record<string, AdminNoteItem[]>>(
    (accumulator, note) => {
      const key = note.targetId;

      accumulator[key] ??= [];
      accumulator[key].push({
        id: note.id,
        body: note.body,
        isPinned: note.isPinned,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
        authorName: note.author.name,
        authorEmail: note.author.email,
      });

      return accumulator;
    },
    {},
  );

  const auditLogsByReportId = auditLogs.reduce<Record<string, AdminAuditLogItem[]>>(
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
        title="Stolen Reports"
        description="Review public theft reports, update their lifecycle status, and remove incorrect reports when needed."
      />

      <AdminPageNotice notice={notice} />

      <AdminStolenReportsTable
        reports={reports.map((report) => ({
          id: report.id,
          propertyId: report.property.id,
          ownerId: report.user.id,
          propertyName: report.propertyName,
          serialNumber: report.serialNumber,
          location: report.location,
          description: report.description,
          status: report.status,
          dateReported: report.dateReported.toISOString(),
          ownerName: report.user.name,
          ownerEmail: report.user.email,
          propertyRecordName: report.property.name,
          propertyArchived: report.property.archivedAt !== null,
          evidenceCount: report.evidenceUrls.length,
        }))}
        notesByReportId={notesByReportId}
        auditLogsByReportId={auditLogsByReportId}
      />
    </div>
  );
}
