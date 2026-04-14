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
import { PROPERTY_STATUSES, PROPERTY_TYPES } from "@/lib/catcher-domain";
import {
  archivePropertyAction,
  bulkArchivePropertiesAction,
  bulkRestorePropertiesAction,
  deletePropertyAction,
  restorePropertyAction,
  updatePropertyAction,
} from "../actions";
import { formatAdminDate } from "../admin-page-utils";

export type AdminPropertyRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  serialNumber: string;
  description: string | null;
  dateRegistered: string;
  archivedAt: string | null;
  archiveReason: string | null;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  photoCount: number;
  stolenReportCount: number;
  coveragePlanName: string | null;
  coverageStatus: string | null;
};

function getPropertyStatusBadgeClass(status: string) {
  switch (status) {
    case "Stolen":
      return "bg-red-100 text-red-800";
    case "Flagged":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-green-100 text-green-800";
  }
}

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

export function AdminPropertiesTable({
  properties,
  notesByPropertyId,
  auditLogsByPropertyId,
}: {
  properties: AdminPropertyRow[];
  notesByPropertyId: Record<string, AdminNoteItem[]>;
  auditLogsByPropertyId: Record<string, AdminAuditLogItem[]>;
}) {
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<string | null>(
    properties[0]?.id ?? null,
  );
  const [selectedPropertyIds, setSelectedPropertyIds] = React.useState<string[]>([]);
  const [visibilityFilter, setVisibilityFilter] = React.useState<"all" | "live" | "archived">(
    "all",
  );
  const [planStatusFilter, setPlanStatusFilter] = React.useState<
    "all" | "none" | "scheduled" | "active" | "grace" | "archived" | "cancelled"
  >("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const filteredProperties = React.useMemo(
    () =>
      properties.filter((property) => {
        if (visibilityFilter === "live" && property.archivedAt) {
          return false;
        }

        if (visibilityFilter === "archived" && !property.archivedAt) {
          return false;
        }

        if (planStatusFilter === "none" && property.coverageStatus !== null) {
          return false;
        }

        if (
          planStatusFilter !== "all" &&
          planStatusFilter !== "none" &&
          property.coverageStatus !== planStatusFilter
        ) {
          return false;
        }

        return isDateWithinRange(property.dateRegistered, dateFrom, dateTo);
      }),
    [dateFrom, dateTo, planStatusFilter, properties, visibilityFilter],
  );

  const filteredPropertyIds = React.useMemo(
    () => filteredProperties.map((property) => property.id),
    [filteredProperties],
  );

  React.useEffect(() => {
    setSelectedPropertyIds((current) =>
      current.filter((id) => filteredPropertyIds.includes(id)),
    );
  }, [filteredPropertyIds]);

  React.useEffect(() => {
    if (!filteredProperties.length) {
      setSelectedPropertyId(null);
      return;
    }

    if (
      !selectedPropertyId ||
      !filteredProperties.some((property) => property.id === selectedPropertyId)
    ) {
      setSelectedPropertyId(filteredProperties[0]?.id ?? null);
    }
  }, [filteredProperties, selectedPropertyId]);

  const selectedProperty =
    filteredProperties.find((property) => property.id === selectedPropertyId) ?? null;

  const selectedPropertyNotes = selectedProperty
    ? notesByPropertyId[selectedProperty.id] ?? []
    : [];
  const selectedPropertyAuditLogs = selectedProperty
    ? auditLogsByPropertyId[selectedProperty.id] ?? []
    : [];

  const allVisibleSelected =
    filteredPropertyIds.length > 0 &&
    filteredPropertyIds.every((id) => selectedPropertyIds.includes(id));

  const togglePropertySelection = React.useCallback(
    (propertyId: string, checked: boolean) => {
      setSelectedPropertyIds((current) => {
        if (checked) {
          return current.includes(propertyId) ? current : [...current, propertyId];
        }

        return current.filter((id) => id !== propertyId);
      });
    },
    [],
  );

  const columns = React.useMemo<ColumnDef<AdminPropertyRow>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <input
            type="checkbox"
            aria-label="Select all visible properties"
            checked={allVisibleSelected}
            onChange={(event) =>
              setSelectedPropertyIds(event.target.checked ? filteredPropertyIds : [])
            }
            className="h-4 w-4 rounded border-slate-300 text-[#36689e] focus:ring-[#36689e]"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.name}`}
            checked={selectedPropertyIds.includes(row.original.id)}
            onChange={(event) =>
              togglePropertySelection(row.original.id, event.target.checked)
            }
            onClick={(event) => event.stopPropagation()}
            className="h-4 w-4 rounded border-slate-300 text-[#36689e] focus:ring-[#36689e]"
          />
        ),
      },
      {
        accessorKey: "name",
        header: "Property",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-semibold text-[#0F2651]">{row.original.name}</p>
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
        accessorKey: "type",
        header: "Type",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Badge className={getPropertyStatusBadgeClass(row.original.status)}>
              {row.original.status}
            </Badge>
            <Badge
              className={
                row.original.archivedAt
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-700"
              }
            >
              {row.original.archivedAt ? "Archived" : "Live"}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "coveragePlanName",
        header: "Subscription",
        cell: ({ row }) =>
          row.original.coveragePlanName ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#0F2651]">
                {row.original.coveragePlanName}
              </p>
              <p className="text-xs text-slate-500">{row.original.coverageStatus}</p>
            </div>
          ) : (
            <span className="text-sm text-slate-500">None</span>
          ),
      },
      {
        accessorKey: "dateRegistered",
        header: "Registered",
        cell: ({ row }) => formatAdminDate(row.original.dateRegistered),
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
              setSelectedPropertyId(row.original.id);
            }}
          >
            Manage
          </Button>
        ),
      },
    ],
    [allVisibleSelected, filteredPropertyIds, selectedPropertyIds, togglePropertySelection],
  );

  return (
    <div className="space-y-6">
      <AdminDataTable
        columns={columns}
        data={filteredProperties}
        baseCount={properties.length}
        selectedCount={selectedPropertyIds.length}
        entityLabel="properties"
        searchPlaceholder="Search by property, serial number, owner, or subscription"
        emptyStateTitle="No properties found"
        emptyStateDescription="Registered property records will appear here for full admin review."
        searchPredicate={(property, query) =>
          [
            property.name,
            property.serialNumber,
            property.ownerName,
            property.ownerEmail,
            property.type,
            property.status,
            property.coveragePlanName ?? "",
            property.coverageStatus ?? "",
          ].some((value) => value.toLowerCase().includes(query))
        }
        selectedRowId={selectedPropertyId}
        onSelectRow={setSelectedPropertyId}
        toolbar={
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F2651]" htmlFor="property-visibility-filter">
                  Visibility
                </label>
                <select
                  id="property-visibility-filter"
                  value={visibilityFilter}
                  onChange={(event) =>
                    setVisibilityFilter(event.target.value as "all" | "live" | "archived")
                  }
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                >
                  <option value="all">All records</option>
                  <option value="live">Live only</option>
                  <option value="archived">Archived only</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F2651]" htmlFor="property-plan-filter">
                  Plan Status
                </label>
                <select
                  id="property-plan-filter"
                  value={planStatusFilter}
                  onChange={(event) =>
                    setPlanStatusFilter(
                      event.target.value as
                        | "all"
                        | "none"
                        | "scheduled"
                        | "active"
                        | "grace"
                        | "archived"
                        | "cancelled",
                    )
                  }
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                >
                  <option value="all">All plan states</option>
                  <option value="active">Active</option>
                  <option value="grace">Grace</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="none">No plan</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F2651]" htmlFor="property-date-from">
                  Registered From
                </label>
                <Input
                  id="property-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0F2651]" htmlFor="property-date-to">
                  Registered To
                </label>
                <Input
                  id="property-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button asChild variant="outline" className="w-full">
                  <a href="/admin/properties/export">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <form
                action={bulkArchivePropertiesAction}
                className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                onSubmit={(event) => {
                  if (selectedPropertyIds.length === 0) {
                    return;
                  }

                  const confirmed = window.confirm(
                    `Archive ${selectedPropertyIds.length} selected propert${selectedPropertyIds.length === 1 ? 'y' : 'ies'}?`,
                  );

                  if (!confirmed) {
                    event.preventDefault();
                  }
                }}
              >
                <input
                  type="hidden"
                  name="selected_ids"
                  value={JSON.stringify(selectedPropertyIds)}
                />
                <input type="hidden" name="redirect_to" value="/admin/properties" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#0F2651]">Bulk archive</p>
                  <p className="text-sm text-slate-600">
                    {selectedPropertyIds.length === 0
                      ? "Select one or more properties to archive together."
                      : `${selectedPropertyIds.length} propert${selectedPropertyIds.length === 1 ? "y" : "ies"} selected.`}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-[#0F2651]" htmlFor="bulk-property-archive-reason">
                      Archive Reason
                    </label>
                    <Input
                      id="bulk-property-archive-reason"
                      name="archive_reason"
                      placeholder="Optional reason for the audit trail"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    className="border-amber-300 text-amber-800"
                    disabled={selectedPropertyIds.length === 0}
                  >
                    Archive Selected
                  </Button>
                </div>
              </form>

              <form
                action={bulkRestorePropertiesAction}
                className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                onSubmit={(event) => {
                  if (selectedPropertyIds.length === 0) {
                    return;
                  }

                  const confirmed = window.confirm(
                    `Restore ${selectedPropertyIds.length} selected propert${selectedPropertyIds.length === 1 ? 'y' : 'ies'} to live visibility?`,
                  );

                  if (!confirmed) {
                    event.preventDefault();
                  }
                }}
              >
                <input
                  type="hidden"
                  name="selected_ids"
                  value={JSON.stringify(selectedPropertyIds)}
                />
                <input type="hidden" name="redirect_to" value="/admin/properties" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#0F2651]">Bulk restore</p>
                  <p className="text-sm text-slate-600">
                    Restore archived properties to active visibility without creating duplicates.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="bg-green-600 text-white hover:bg-green-700"
                  disabled={selectedPropertyIds.length === 0}
                >
                  Restore Selected
                </Button>
              </form>
            </div>
          </div>
        }
        renderMobileCard={(property) => (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  aria-label={`Select ${property.name}`}
                  checked={selectedPropertyIds.includes(property.id)}
                  onChange={(event) =>
                    togglePropertySelection(property.id, event.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#36689e] focus:ring-[#36689e]"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-[#0F2651]">{property.name}</p>
                  <p className="truncate text-xs text-slate-500">{property.ownerEmail}</p>
                </div>
              </div>
              <Badge
                className={
                  property.archivedAt
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-700"
                }
              >
                {property.archivedAt ? "Archived" : "Live"}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={getPropertyStatusBadgeClass(property.status)}>
                {property.status}
              </Badge>
              {property.coveragePlanName ? (
                <Badge className="bg-blue-100 text-blue-800">
                  {property.coveragePlanName} · {property.coverageStatus}
                </Badge>
              ) : (
                <Badge className="bg-slate-100 text-slate-700">No plan</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Type</p>
                <p className="mt-1 font-semibold text-[#0F2651]">{property.type}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Registered</p>
                <p className="mt-1 font-semibold text-[#0F2651]">
                  {formatAdminDate(property.dateRegistered)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Photos</p>
                <p className="mt-1 font-semibold text-[#0F2651]">{property.photoCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Reports</p>
                <p className="mt-1 font-semibold text-[#0F2651]">{property.stolenReportCount}</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setSelectedPropertyId(property.id)}
            >
              Manage Property
            </Button>
          </div>
        )}
      />

      {selectedProperty ? (
        <div className="space-y-6">
          <Card className="overflow-hidden border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle className="text-[#0F2651]">{selectedProperty.name}</CardTitle>
                  <CardDescription className="mt-1 break-all">
                    Owner: {selectedProperty.ownerName} · {selectedProperty.ownerEmail}
                  </CardDescription>
                  <p className="mt-2 text-sm text-slate-500">
                    Serial: {selectedProperty.serialNumber}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={
                      selectedProperty.archivedAt
                        ? "bg-amber-100 text-amber-800"
                        : "bg-green-100 text-green-800"
                    }
                  >
                    {selectedProperty.archivedAt ? "Archived" : "Live"}
                  </Badge>
                  <Badge className={getPropertyStatusBadgeClass(selectedProperty.status)}>
                    {selectedProperty.status}
                  </Badge>
                  {selectedProperty.coveragePlanName ? (
                    <Badge className="bg-blue-100 text-blue-800">
                      {selectedProperty.coveragePlanName} · {selectedProperty.coverageStatus}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#0F2651]">
                    {selectedProperty.type}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Registered
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#0F2651]">
                    {formatAdminDate(selectedProperty.dateRegistered)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Photos
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#0F2651]">
                    {selectedProperty.photoCount}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Stolen Reports
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#0F2651]">
                    {selectedProperty.stolenReportCount}
                  </p>
                </div>
              </div>

              <form
                action={updatePropertyAction}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4"
                onSubmit={(event) => {
                  const confirmed = window.confirm(
                    `Save property changes for ${selectedProperty.name}?`,
                  );

                  if (!confirmed) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="property_id" value={selectedProperty.id} />
                <input type="hidden" name="redirect_to" value="/admin/properties" />
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0F2651]" htmlFor={`name-${selectedProperty.id}`}>
                      Name
                    </label>
                    <Input id={`name-${selectedProperty.id}`} name="name" defaultValue={selectedProperty.name} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0F2651]" htmlFor={`type-${selectedProperty.id}`}>
                      Type
                    </label>
                    <select
                      id={`type-${selectedProperty.id}`}
                      name="type"
                      defaultValue={selectedProperty.type}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                    >
                      {PROPERTY_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0F2651]" htmlFor={`status-${selectedProperty.id}`}>
                      Status
                    </label>
                    <select
                      id={`status-${selectedProperty.id}`}
                      name="status"
                      defaultValue={selectedProperty.status}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                    >
                      {PROPERTY_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F2651]" htmlFor={`description-${selectedProperty.id}`}>
                    Description
                  </label>
                  <Textarea
                    id={`description-${selectedProperty.id}`}
                    name="description"
                    defaultValue={selectedProperty.description ?? ""}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="bg-[#36689e] text-white hover:bg-[#0F2651]">
                  Save Property
                </Button>
              </form>

              {selectedProperty.archiveReason ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  <p className="font-semibold text-[#0F2651]">Archive reason</p>
                  <p className="mt-1">{selectedProperty.archiveReason}</p>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 xl:flex-row">
                {selectedProperty.archivedAt ? (
                  <form
                    action={restorePropertyAction}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 xl:min-w-[18rem]"
                    onSubmit={(event) => {
                      const confirmed = window.confirm(
                        `Restore ${selectedProperty.name} to live visibility?`,
                      );

                      if (!confirmed) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="property_id" value={selectedProperty.id} />
                    <input type="hidden" name="redirect_to" value="/admin/properties" />
                    <Button type="submit" className="bg-green-600 text-white hover:bg-green-700">
                      Restore Property
                    </Button>
                  </form>
                ) : (
                  <form
                    action={archivePropertyAction}
                    className="flex flex-1 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                    onSubmit={(event) => {
                      const confirmed = window.confirm(
                        `Archive ${selectedProperty.name}?`,
                      );

                      if (!confirmed) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="property_id" value={selectedProperty.id} />
                    <input type="hidden" name="redirect_to" value="/admin/properties" />
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#0F2651]" htmlFor={`archive-${selectedProperty.id}`}>
                        Archive reason
                      </label>
                      <Input
                        id={`archive-${selectedProperty.id}`}
                        name="archive_reason"
                        placeholder="Optional reason shown in admin history"
                      />
                    </div>
                    <Button type="submit" variant="outline" className="border-amber-300 text-amber-800">
                      Archive Property
                    </Button>
                  </form>
                )}

                <form
                  action={deletePropertyAction}
                  className="rounded-2xl border border-red-200 bg-red-50 p-4 xl:min-w-[16rem]"
                  onSubmit={(event) => {
                    const confirmed = window.confirm(
                      `Delete ${selectedProperty.name} and all dependent records? This cannot be undone.`,
                    );

                    if (!confirmed) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="property_id" value={selectedProperty.id} />
                  <input type="hidden" name="redirect_to" value="/admin/properties" />
                  <p className="text-sm text-red-700">
                    Delete this property and all dependent photos, coverages, and reports.
                  </p>
                  <Button type="submit" variant="ghost" className="mt-3 px-0 text-red-700 hover:text-red-800">
                    Delete Property
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <AdminNotesPanel
              redirectTo="/admin/properties"
              targetType="Property"
              targetId={selectedProperty.id}
              targetLabel={selectedProperty.name}
              targetUserId={selectedProperty.ownerId}
              propertyId={selectedProperty.id}
              notes={selectedPropertyNotes}
            />
            <AdminAuditLogList logs={selectedPropertyAuditLogs} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
