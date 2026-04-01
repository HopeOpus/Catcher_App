"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAdminDateTime } from "../admin-page-utils";

export type AdminAuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string | null;
  summary: string;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
};

function normalizeDateValue(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function AdminAuditLogsTable({ logs }: { logs: AdminAuditLogRow[] }) {
  const [selectedLogId, setSelectedLogId] = React.useState<string | null>(logs[0]?.id ?? null);
  const [entityTypeFilter, setEntityTypeFilter] = React.useState<string>("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  React.useEffect(() => {
    if (!logs.length) {
      setSelectedLogId(null);
      return;
    }

    if (!selectedLogId || !logs.some((log) => log.id === selectedLogId)) {
      setSelectedLogId(logs[0]?.id ?? null);
    }
  }, [logs, selectedLogId]);

  const entityTypes = React.useMemo(
    () => Array.from(new Set(logs.map((log) => log.entityType))).sort(),
    [logs],
  );

  const filteredLogs = React.useMemo(() => {
    return logs.filter((log) => {
      if (entityTypeFilter !== "all" && log.entityType !== entityTypeFilter) {
        return false;
      }

      const logDate = normalizeDateValue(log.createdAt);

      if (dateFrom && logDate < dateFrom) {
        return false;
      }

      if (dateTo && logDate > dateTo) {
        return false;
      }

      return true;
    });
  }, [dateFrom, dateTo, entityTypeFilter, logs]);

  const selectedLog = filteredLogs.find((log) => log.id === selectedLogId) ?? null;

  const columns = React.useMemo<ColumnDef<AdminAuditLogRow>[]>(
    () => [
      {
        accessorKey: "summary",
        header: "Summary",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium text-[#0F2651]">{row.original.summary}</p>
            <p className="text-xs text-slate-500">{row.original.action}</p>
          </div>
        ),
      },
      {
        accessorKey: "entityType",
        header: "Entity",
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge className="bg-slate-100 text-slate-700">{row.original.entityType}</Badge>
            <p className="text-xs text-slate-500">
              {row.original.entityLabel ?? row.original.entityId}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "actorName",
        header: "Actor",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">
              {row.original.actorName ?? "Unknown admin"}
            </p>
            <p className="text-xs text-slate-500">{row.original.actorEmail ?? "No email"}</p>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatAdminDateTime(row.original.createdAt),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-[#0F2651]">Advanced Filters</CardTitle>
          <CardDescription>
            Narrow audit activity by entity type and date range.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <select
            value={entityTypeFilter}
            onChange={(event) => setEntityTypeFilter(event.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
          >
            <option value="all">All entities</option>
            {entityTypes.map((entityType) => (
              <option key={entityType} value={entityType}>
                {entityType}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
          />
        </CardContent>
      </Card>

      <AdminDataTable
        columns={columns}
        data={filteredLogs}
        entityLabel="audit logs"
        searchPlaceholder="Search by summary, action, actor, or label"
        emptyStateTitle="No audit logs found"
        emptyStateDescription="Admin audit activity will appear here as operations are performed across the system."
        selectedRowId={selectedLogId}
        onSelectRow={setSelectedLogId}
        searchPredicate={(log, query) =>
          [
            log.summary,
            log.action,
            log.entityType,
            log.entityLabel ?? "",
            log.entityId,
            log.actorName ?? "",
            log.actorEmail ?? "",
          ].some((value) => value.toLowerCase().includes(query))
        }
        renderMobileCard={(log) => (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-slate-100 text-slate-700">{log.entityType}</Badge>
            </div>
            <p className="font-medium text-[#0F2651]">{log.summary}</p>
            <p className="text-xs text-slate-500">{log.action}</p>
            <p className="text-xs text-slate-500">
              {log.actorName ?? "Unknown admin"}
              {log.actorEmail ? ` · ${log.actorEmail}` : ""}
            </p>
            <p className="text-xs text-slate-500">{formatAdminDateTime(log.createdAt)}</p>
          </div>
        )}
      />

      {selectedLog ? (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-[#0F2651]">Audit Detail</CardTitle>
            <CardDescription>
              Full context for the selected audit event.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-slate-100 text-slate-700">{selectedLog.entityType}</Badge>
              <Badge className="bg-[#36689e]/10 text-[#0F2651]">{selectedLog.action}</Badge>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="font-medium text-[#0F2651]">{selectedLog.summary}</p>
              <p className="mt-2 text-sm text-slate-600">
                Entity: {selectedLog.entityLabel ?? selectedLog.entityId}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Actor: {selectedLog.actorName ?? "Unknown admin"}
                {selectedLog.actorEmail ? ` · ${selectedLog.actorEmail}` : ""}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Recorded: {formatAdminDateTime(selectedLog.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
