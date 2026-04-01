import { requireAdminPageAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import {
  AdminPageHeader,
  AdminPageNotice,
  getAdminPageNotice,
  type AdminPageSearchParams,
} from "../admin-page-utils";
import { AdminAuditLogsTable } from "./admin-audit-logs-table";

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams?: AdminPageSearchParams;
}) {
  await requireAdminPageAccess();
  const notice = await getAdminPageNotice(searchParams);

  const logs = await prisma.auditLog.findMany({
    include: {
      actor: {
        select: {
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Audit Logs"
        description="Review admin actions across users, properties, stolen reports, catalog items, property coverages, and payment events."
      />

      <AdminPageNotice notice={notice} />

      <AdminAuditLogsTable
        logs={logs.map((log) => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          entityLabel: log.entityLabel,
          summary: log.summary,
          actorName: log.actor?.name ?? null,
          actorEmail: log.actor?.email ?? null,
          createdAt: log.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
