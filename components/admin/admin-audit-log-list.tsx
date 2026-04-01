import { History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type AdminAuditLogItem = {
  id: string;
  action: string;
  summary: string;
  entityType: string;
  entityLabel: string | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
};

type AdminAuditLogListProps = {
  title?: string;
  description?: string;
  logs: AdminAuditLogItem[];
  emptyStateMessage?: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminAuditLogList({
  title = "Recent Audit Activity",
  description = "Latest admin actions recorded for this record.",
  logs,
  emptyStateMessage = "No audit activity recorded yet.",
}: AdminAuditLogListProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#0F2651]">
          <History className="h-5 w-5 text-[#36689e]" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
            {emptyStateMessage}
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-[#0F2651]">{log.summary}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                      {log.entityType}
                      {log.entityLabel ? ` · ${log.entityLabel}` : ""}
                    </p>
                    {log.actorName || log.actorEmail ? (
                      <p className="mt-2 text-xs text-slate-500">
                        By {log.actorName ?? "Unknown admin"}
                        {log.actorEmail ? ` · ${log.actorEmail}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">{formatDateTime(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
