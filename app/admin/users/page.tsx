import { Card, CardContent } from '@/components/ui/card';
import type { AdminAuditLogItem } from '@/components/admin/admin-audit-log-list';
import type { AdminNoteItem } from '@/components/admin/admin-notes-panel';
import { requireAdminPageAccess } from '@/lib/admin-access';
import { prisma } from '@/lib/prisma';
import {
  AdminPageHeader,
  AdminPageNotice,
  getAdminPageNotice,
  type AdminPageSearchParams,
} from '../admin-page-utils';
import { AdminUsersTable } from './admin-users-table';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: AdminPageSearchParams;
}) {
  await requireAdminPageAccess();
  const notice = await getAdminPageNotice(searchParams);

  const [users, notes, auditLogs] = await Promise.all([
    prisma.user.findMany({
      include: {
        _count: {
          select: {
            properties: true,
            stolenReports: true,
            propertyCoverages: true,
          },
        },
      },
      orderBy: [{ role: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.adminNote.findMany({
      where: {
        targetType: 'User',
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
        entityType: 'User',
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

  const notesByUserId = notes.reduce<Record<string, AdminNoteItem[]>>((accumulator, note) => {
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
  }, {});

  const auditLogsByUserId = auditLogs.reduce<Record<string, AdminAuditLogItem[]>>(
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
        title="Users"
        description="Review account activity and manage which signed-in users have admin access. Clerk remains the source of truth for identity creation."
      />

      <AdminPageNotice notice={notice} />

      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="px-6 py-5 text-sm text-slate-700">
          User accounts are created through Clerk sign-in. From the admin panel, you can
          review users and change their access level between <span className="font-semibold">User</span>{' '}
          and <span className="font-semibold">Admin</span>.
        </CardContent>
      </Card>

      <AdminUsersTable
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
          propertyCount: user._count.properties,
          stolenReportCount: user._count.stolenReports,
          propertyCoverageCount: user._count.propertyCoverages,
        }))}
        notesByUserId={notesByUserId}
        auditLogsByUserId={auditLogsByUserId}
      />
    </div>
  );
}
