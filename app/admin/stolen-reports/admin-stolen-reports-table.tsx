"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { AdminAuditLogList, type AdminAuditLogItem } from "@/components/admin/admin-audit-log-list";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminNotesPanel, type AdminNoteItem } from "@/components/admin/admin-notes-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  STOLEN_REPORT_STATUSES,
  getStolenReportStatusLabel,
} from "@/lib/catcher-domain";
import {
  bulkUpdateStolenReportStatusAction,
  deleteStolenReportAction,
  updateStolenReportAction,
} from "../actions";
import { formatAdminDate } from "../admin-page-utils";

export type AdminStolenReportRow = {
  id: string;
  propertyId: string;
  ownerId: string;
  propertyName: string;
  serialNumber: string;
  location: string;
  description: string | null;
  status: string;
  dateReported: string;
  ownerName: string;
  ownerEmail: string;
  propertyRecordName: string;
  propertyArchived: boolean;
  evidenceCount: number;
};

function isDateWithinRange(value: string, from: string, to: string) {
  const date = new Date(value).getTime();

  if (Number.isNaN(date)) {
    return false;
  }

  if (from) {
    const fromDate = new Date(`${from}T00:00:00`).getTime();

    if (date < fromDate) {
      return false;
    }
  }

  if (to) {
    const toDate = new Date(`${to}T23:59:59.999`).getTime();

    if (date > toDate) {
      return false;
    }
  }

  return true;
}

export function AdminStolenReportsTable({
  reports,
  notesByReportId,
  auditLogsByReportId,
}: {
  reports: AdminStolenReportRow[];
  notesByReportId: Record<string, AdminNoteItem[]>;
  auditLogsByReportId: Record<string, AdminAuditLogItem[]>;
}) {
  const [selectedReportId, setSelectedReportId] = React.useState<string | null>(
    reports[0]?.id ?? null,
  );
  const [selectedReportIds, setSelectedReportIds] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "Reported" | "UnderInvestigation" | "Resolved"
  >("all");
  const [archivedFilter, setArchivedFilter] = React.useState<"all" | "live" | "archived">(
    "all",
  );
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const filteredReports = React.useMemo(
    () =>
      reports.filter((report) => {
        if (statusFilter !== "all" && report.status !== statusFilter) {
          return false;
        }

        if (archivedFilter === "live" && report.propertyArchived) {
          return false;
        }

        if (archivedFilter === "archived" && !report.propertyArchived) {
          return false;
        }

        return isDateWithinRange(report.dateReported, dateFrom, dateTo);
      }),
    [archivedFilter, dateFrom, dateTo, reports, statusFilter],
  );

  const filteredReportIds = React.useMemo(
    () => filteredReports.map((report) => report.id),
    [filteredReports],
  );

  React.useEffect(() => {
    setSelectedReportIds((current) =>
      current.filter((id) => filteredReportIds.includes(id)),
    );
  }, [filteredReportIds]);

  React.useEffect(() => {
    if (!filteredReports.length) {
      setSelectedReportId(null);
      return;
    }

    if (
      !selectedReportId ||
      !filteredReports.some((report) => report.id === selectedReportId)
    ) {
      setSelectedReportId(filteredReports[0]?.id ?? null);
    }
  }, [filteredReports, selectedReportId]);

  const selectedReport =
    filteredReports.find((report) => report.id === selectedReportId) ?? null;

  const selectedReportNotes = selectedReport
    ? notesByReportId[selectedReport.id] ?? []
    : [];
  const selectedReportAuditLogs = selectedReport
    ? auditLogsByReportId[selectedReport.id] ?? []
    : [];

  const allVisibleSelected =
    filteredReportIds.length > 0 &&
    filteredReportIds.every((id) => selectedReportIds.includes(id));

  const toggleReportSelection = React.useCallback(
    (reportId: string, checked: boolean) => {
      setSelectedReportIds((current) => {
        if (checked) {
          return current.includes(reportId) ? current : [...current, reportId];
        }

        return current.filter((id) => id !== reportId);
      });
    },
    [],
  );

  const columns = React.useMemo<ColumnDef<AdminStolenReportRow>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <input
            type="checkbox"
            aria-label="Select all visible reports"
            checked={allVisibleSelected}
            onChange={(event) =>
              setSelectedReportIds(event.target.checked ? filteredReportIds : [])
            }
            className="h-4 w-4 rounded border-slate-300 text-[#36689e] focus:ring-[#36689e]"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.propertyName}`}
            checked={selectedReportIds.includes(row.original.id)}
            onChange={(event) =>
              toggleReportSelection(row.original.id, event.target.checked)
            }
            onClick={(event) => event.stopPropagation()}
            className="h-4 w-4 rounded border-slate-300 text-[#36689e] focus:ring-[#36689e]"
          />
        ),
      },
      {
        accessorKey: "propertyName",
        header: "Reported Item",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-semibold text-[#0F2651]">{row.original.propertyName}</p>
            <p className="text-xs text-slate-500">{row.original.serialNumber}</p>
          </div>
        ),
      },
      {
        accessorKey: "ownerName",
        header: "Owner",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">{row.original.ownerName}</p>
            <p className="text-xs text-slate-500">{row.original.ownerEmail}</p>
          </div>
        ),
      },
      {
        accessorKey: "location",
        header: "Location",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-slate-100 text-slate-700">
              {getStolenReportStatusLabel(row.original.status)}
            </Badge>
            {row.original.propertyArchived ? (
              <Badge className="bg-amber-100 text-amber-800">Property Archived</Badge>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "evidenceCount",
        header: "Evidence",
      },
      {
        accessorKey: "dateReported",
        header: "Date Reported",
        cell: ({ row }) => formatAdminDate(row.original.dateReported),
      },
      {
        id: "actions",
        header: "Action",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedReportId(row.original.id);
            }}
          >
            Manage
          </Button>
        ),
      },
    ],
    [allVisibleSelected, filteredReportIds, selectedReportIds, toggleReportSelection],
  );

  return (
    <div className="space-y-6">
      <AdminDataTable
        columns={columns}
        data={filteredReports}
        entityLabel="reports"
        searchPlaceholder="Search by item, serial number, owner, or location"
        emptyStateTitle="No stolen reports found"
        emptyStateDescription="Once users file public theft reports, they will appear here for admin review."
        searchPredicate={(report, query) =>
          [
            report.propertyName,
            report.serialNumber,
            report.ownerName,
            report.ownerEmail,
            report.location,
            report.status,
          ].some((value) => value.toLowerCase().includes(query))
        }
        selectedRowId={selectedReportId}
        onSelectRow={setSelectedReportId}
        toolbar={
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F2651]" htmlFor="report-status-filter">
                  Report Status
                </label>
                <select
                  id="report-status-filter"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as "all" | "Reported" | "UnderInvestigation" | "Resolved",
                    )
                  }
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                >
                  <option value="all">All statuses</option>
                  {STOLEN_REPORT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getStolenReportStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F2651]" htmlFor="report-archived-filter">
                  Property State
                </label>
                <select
                  id="report-archived-filter"
                  value={archivedFilter}
                  onChange={(event) =>
                    setArchivedFilter(event.target.value as "all" | "live" | "archived")
                  }
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                >
                  <option value="all">All records</option>
                  <option value="live">Linked live properties</option>
                  <option value="archived">Linked archived properties</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F2651]" htmlFor="report-date-from">
                  Reported From
                </label>
                <Input
                  id="report-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F2651]" htmlFor="report-date-to">
                  Reported To
                </label>
                <Input
                  id="report-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button asChild variant="outline" className="w-full">
                  <a href="/admin/stolen-reports/export">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </a>
                </Button>
              </div>
            </div>

            <form
              action={bulkUpdateStolenReportStatusAction}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:flex-row xl:items-end xl:justify-between"
            >
              <input
                type="hidden"
                name="selected_ids"
                value={JSON.stringify(selectedReportIds)}
              />
              <input type="hidden" name="redirect_to" value="/admin/stolen-reports" />

              <div className="space-y-1">
                <p className="text-sm font-medium text-[#0F2651]">Bulk status update</p>
                <p className="text-sm text-slate-600">
                  {selectedReportIds.length === 0
                    ? "Select one or more reports to update together."
                    : `${selectedReportIds.length} report${selectedReportIds.length === 1 ? "" : "s"} selected.`}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F2651]" htmlFor="bulk-report-status">
                    New Status
                  </label>
                  <select
                    id="bulk-report-status"
                    name="status"
                    defaultValue="UnderInvestigation"
                    className="h-10 min-w-48 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                  >
                    {STOLEN_REPORT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {getStolenReportStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="submit"
                  className="bg-[#36689e] text-white hover:bg-[#0F2651]"
                  disabled={selectedReportIds.length === 0}
                >
                  Update Selected Reports
                </Button>
              </div>
            </form>
          </div>
        }
        renderMobileCard={(report) => (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                aria-label={`Select ${report.propertyName}`}
                checked={selectedReportIds.includes(report.id)}
                onChange={(event) =>
                  toggleReportSelection(report.id, event.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#36689e] focus:ring-[#36689e]"
              />
              <div className="space-y-1">
                <p className="font-semibold text-[#0F2651]">{report.propertyName}</p>
                <p className="text-xs text-slate-500">{report.serialNumber}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-slate-100 text-slate-700">
                {getStolenReportStatusLabel(report.status)}
              </Badge>
              {report.propertyArchived ? (
                <Badge className="bg-amber-100 text-amber-800">Property Archived</Badge>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Owner</p>
                <p className="mt-1 font-semibold text-[#0F2651]">{report.ownerName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Location</p>
                <p className="mt-1 font-semibold text-[#0F2651]">{report.location}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Evidence</p>
                <p className="mt-1 font-semibold text-[#0F2651]">{report.evidenceCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Reported</p>
                <p className="mt-1 font-semibold text-[#0F2651]">
                  {formatAdminDate(report.dateReported)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setSelectedReportId(report.id)}
            >
              Manage Report
            </Button>
          </div>
        )}
      />

      {selectedReport ? (
        <div className="space-y-6">
          <Card className="overflow-hidden border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <CardTitle className="text-[#0F2651]">{selectedReport.propertyName}</CardTitle>
                  <CardDescription className="mt-1 break-all">
                    Owner: {selectedReport.ownerName} · {selectedReport.ownerEmail}
                  </CardDescription>
                  <p className="mt-2 text-sm text-slate-500">
                    Serial: {selectedReport.serialNumber}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-slate-100 text-slate-700">
                    {getStolenReportStatusLabel(selectedReport.status)}
                  </Badge>
                  {selectedReport.propertyArchived ? (
                    <Badge className="bg-amber-100 text-amber-800">Property Archived</Badge>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date Reported
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#0F2651]">
                    {formatAdminDate(selectedReport.dateReported)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Property Record
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#0F2651]">
                    {selectedReport.propertyRecordName}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Evidence Files
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#0F2651]">
                    {selectedReport.evidenceCount}
                  </p>
                </div>
              </div>

              <form
                action={updateStolenReportAction}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <input type="hidden" name="report_id" value={selectedReport.id} />
                <input type="hidden" name="redirect_to" value="/admin/stolen-reports" />

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0F2651]" htmlFor={`location-${selectedReport.id}`}>
                      Location
                    </label>
                    <Input
                      id={`location-${selectedReport.id}`}
                      name="location"
                      defaultValue={selectedReport.location}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0F2651]" htmlFor={`status-${selectedReport.id}`}>
                      Report Status
                    </label>
                    <select
                      id={`status-${selectedReport.id}`}
                      name="status"
                      defaultValue={selectedReport.status}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                    >
                      {STOLEN_REPORT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {getStolenReportStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F2651]" htmlFor={`description-${selectedReport.id}`}>
                    Description
                  </label>
                  <Textarea
                    id={`description-${selectedReport.id}`}
                    name="description"
                    defaultValue={selectedReport.description ?? ""}
                    rows={4}
                  />
                </div>

                <Button type="submit" className="bg-[#36689e] text-white hover:bg-[#0F2651]">
                  Save Report
                </Button>
              </form>

              <form
                action={deleteStolenReportAction}
                className="rounded-2xl border border-red-200 bg-red-50 p-4"
              >
                <input type="hidden" name="report_id" value={selectedReport.id} />
                <input type="hidden" name="redirect_to" value="/admin/stolen-reports" />
                <p className="text-sm text-red-700">
                  Delete this stolen report if it was created in error or should no longer exist.
                </p>
                <Button type="submit" variant="ghost" className="mt-3 px-0 text-red-700 hover:text-red-800">
                  Delete Report
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <AdminNotesPanel
              redirectTo="/admin/stolen-reports"
              targetType="StolenReport"
              targetId={selectedReport.id}
              targetLabel={selectedReport.propertyName}
              targetUserId={selectedReport.ownerId}
              propertyId={selectedReport.propertyId}
              stolenReportId={selectedReport.id}
              notes={selectedReportNotes}
            />
            <AdminAuditLogList logs={selectedReportAuditLogs} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
