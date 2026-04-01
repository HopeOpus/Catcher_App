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
import { AdminPropertiesTable } from './admin-properties-table';

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams?: AdminPageSearchParams;
}) {
  await requireAdminPageAccess();
  const notice = await getAdminPageNotice(searchParams);

  const [properties, notes, auditLogs] = await Promise.all([
    prisma.property.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        coverages: {
          orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
          take: 1,
        },
        _count: {
          select: {
            photos: true,
            stolenReports: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.adminNote.findMany({
      where: {
        targetType: 'Property',
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
        entityType: 'Property',
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

  const notesByPropertyId = notes.reduce<Record<string, AdminNoteItem[]>>(
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

  const auditLogsByPropertyId = auditLogs.reduce<Record<string, AdminAuditLogItem[]>>(
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
        title="Properties"
        description="Edit registered property records, archive or restore visibility, and remove bad data when needed."
      />

      <AdminPageNotice notice={notice} />

      <AdminPropertiesTable
        properties={properties.map((property) => {
          const latestCoverage = property.coverages[0] ?? null;

          return {
            id: property.id,
            name: property.name,
            type: property.type,
            status: property.status,
            serialNumber: property.serialNumber,
            description: property.description,
            dateRegistered: property.dateRegistered.toISOString(),
          archivedAt: property.archivedAt?.toISOString() ?? null,
          archiveReason: property.archiveReason,
          ownerId: property.user.id,
          ownerName: property.user.name,
          ownerEmail: property.user.email,
          photoCount: property._count.photos,
            stolenReportCount: property._count.stolenReports,
            coveragePlanName: latestCoverage?.planName ?? null,
            coverageStatus: latestCoverage?.status ?? null,
          };
        })}
        notesByPropertyId={notesByPropertyId}
        auditLogsByPropertyId={auditLogsByPropertyId}
      />
    </div>
  );
}
