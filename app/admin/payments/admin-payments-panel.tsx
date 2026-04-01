"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Download, RefreshCcw, SearchCode, ShieldAlert } from "lucide-react";
import { AdminAuditLogList, type AdminAuditLogItem } from "@/components/admin/admin-audit-log-list";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { retryPaymentVerificationAction, updatePaymentReviewAction } from "../actions";
import { formatAdminDateTime } from "../admin-page-utils";

export type AdminPaymentEventRow = {
  id: string;
  provider: string;
  source: string;
  processingOutcome: string | null;
  transactionStatus: string | null;
  reference: string | null;
  providerEventType: string | null;
  providerEnvironment: string | null;
  errorMessage: string | null;
  signatureValid: boolean | null;
  amountKobo: number | null;
  currency: string | null;
  checkoutSessionId: string | null;
  propertyId: string | null;
  coverageId: string | null;
  createdAt: string;
  processedAt: string | null;
};

export type AdminCoverageRow = {
  id: string;
  planName: string;
  status: string;
  propertyName: string;
  userName: string;
  userEmail: string;
  startsAt: string;
  expiresAt: string | null;
};

function formatCurrency(amountKobo: number | null, currency: string | null) {
  if (amountKobo === null || amountKobo === undefined) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency ?? "NGN",
  }).format(amountKobo / 100);
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

export function AdminPaymentsPanel({
  recentEvents,
  recentCoverages,
  auditLogsByEventId,
}: {
  recentEvents: AdminPaymentEventRow[];
  recentCoverages: AdminCoverageRow[];
  auditLogsByEventId: Record<string, AdminAuditLogItem[]>;
}) {
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(
    recentEvents[0]?.id ?? null,
  );
  const [sourceFilter, setSourceFilter] = React.useState<string>("all");
  const [outcomeFilter, setOutcomeFilter] = React.useState<string>("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const sourceOptions = React.useMemo(
    () => ["all", ...Array.from(new Set(recentEvents.map((event) => event.source))).sort()],
    [recentEvents],
  );
  const outcomeOptions = React.useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(
          recentEvents
            .map((event) => event.processingOutcome)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    ],
    [recentEvents],
  );

  const retryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};

    for (const event of recentEvents) {
      const key = `${event.reference ?? event.id}:${event.source}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }

    return counts;
  }, [recentEvents]);

  const filteredEvents = React.useMemo(
    () =>
      recentEvents.filter((event) => {
        if (sourceFilter !== "all" && event.source !== sourceFilter) {
          return false;
        }

        if (outcomeFilter !== "all" && (event.processingOutcome ?? "none") !== outcomeFilter) {
          return false;
        }

        return isDateWithinRange(event.createdAt, dateFrom, dateTo);
      }),
    [dateFrom, dateTo, outcomeFilter, recentEvents, sourceFilter],
  );

  React.useEffect(() => {
    if (!filteredEvents.length) {
      setSelectedEventId(null);
      return;
    }

    if (!selectedEventId || !filteredEvents.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(filteredEvents[0]?.id ?? null);
    }
  }, [filteredEvents, selectedEventId]);

  const selectedEvent =
    filteredEvents.find((event) => event.id === selectedEventId) ?? null;

  const selectedAuditLogs = selectedEvent
    ? auditLogsByEventId[selectedEvent.id] ?? []
    : [];

  const relatedEvents = React.useMemo(() => {
    if (!selectedEvent?.reference) {
      return selectedEvent ? [selectedEvent] : [];
    }

    return recentEvents.filter(
      (event) =>
        event.reference === selectedEvent.reference &&
        event.source === selectedEvent.source,
    );
  }, [recentEvents, selectedEvent]);

  const failedCallbacks = React.useMemo(
    () =>
      recentEvents.filter(
        (event) =>
          event.source === "callback" &&
          (event.errorMessage || (event.processingOutcome ?? "").includes("failed")),
      ).length,
    [recentEvents],
  );
  const invalidWebhookSignatures = React.useMemo(
    () =>
      recentEvents.filter(
        (event) => event.source === "webhook" && event.signatureValid === false,
      ).length,
    [recentEvents],
  );
  const retryCandidates = React.useMemo(
    () =>
      recentEvents.filter(
        (event) =>
          Boolean(event.reference) &&
          (event.errorMessage ||
            event.processingOutcome === "failed" ||
            event.processingOutcome === "error"),
      ).length,
    [recentEvents],
  );

  const eventColumns = React.useMemo<ColumnDef<AdminPaymentEventRow>[]>(
    () => [
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => {
          const retryKey = `${row.original.reference ?? row.original.id}:${row.original.source}`;
          const retryCount = retryCounts[retryKey] ?? 1;

          return (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-slate-100 text-slate-700">{row.original.source}</Badge>
                <Badge className="bg-blue-100 text-blue-800">
                  {row.original.processingOutcome ?? "No outcome"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">Attempts: {retryCount}</p>
            </div>
          );
        },
      },
      {
        accessorKey: "reference",
        header: "Reference",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="break-all text-sm font-medium text-[#0F2651]">
              {row.original.reference ?? "No reference"}
            </p>
            <p className="text-xs text-slate-500">
              {row.original.providerEventType ?? "No provider event type"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "transactionStatus",
        header: "Status",
        cell: ({ row }) => (
          <div className="space-y-2">
            {row.original.transactionStatus ? (
              <Badge className="bg-amber-100 text-amber-800">
                {row.original.transactionStatus}
              </Badge>
            ) : (
              <span className="text-sm text-slate-500">Not available</span>
            )}
            {row.original.signatureValid === false ? (
              <Badge className="bg-red-100 text-red-800">Invalid signature</Badge>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatAdminDateTime(row.original.createdAt),
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
              setSelectedEventId(row.original.id);
            }}
          >
            Review
          </Button>
        ),
      },
    ],
    [retryCounts],
  );

  const coverageColumns = React.useMemo<ColumnDef<AdminCoverageRow>[]>(
    () => [
      {
        accessorKey: "planName",
        header: "Subscription",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-[#0F2651] text-white">{row.original.planName}</Badge>
            <Badge className="bg-slate-100 text-slate-700">{row.original.status}</Badge>
          </div>
        ),
      },
      {
        accessorKey: "propertyName",
        header: "Property",
      },
      {
        accessorKey: "userName",
        header: "Owner",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-900">{row.original.userName}</p>
            <p className="text-xs text-slate-500">{row.original.userEmail}</p>
          </div>
        ),
      },
      {
        accessorKey: "startsAt",
        header: "Starts",
        cell: ({ row }) => formatAdminDateTime(row.original.startsAt),
      },
      {
        accessorKey: "expiresAt",
        header: "Expires",
        cell: ({ row }) =>
          row.original.expiresAt ? formatAdminDateTime(row.original.expiresAt) : "No expiry",
      },
    ],
    [],
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-full bg-red-50 p-3 text-red-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Failed Callbacks</p>
              <p className="text-2xl font-semibold text-[#0F2651]">{failedCallbacks}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-full bg-amber-50 p-3 text-amber-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Invalid Webhooks</p>
              <p className="text-2xl font-semibold text-[#0F2651]">{invalidWebhookSignatures}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-full bg-blue-50 p-3 text-blue-700">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Retry Candidates</p>
              <p className="text-2xl font-semibold text-[#0F2651]">{retryCandidates}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-full bg-slate-100 p-3 text-slate-700">
              <SearchCode className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Recent Events</p>
              <p className="text-2xl font-semibold text-[#0F2651]">{recentEvents.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-[#0F2651]">Payment Investigation</CardTitle>
          <CardDescription>
            Filter Paystack activity, inspect retries by reference, and reconcile events safely.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <AdminDataTable
            columns={eventColumns}
            data={filteredEvents}
            entityLabel="events"
            searchPlaceholder="Search event references, sources, or outcomes"
            emptyStateTitle="No payment events recorded yet"
            emptyStateDescription="Paystack initialize, callback, verify, and webhook activity will appear here once the system processes payments."
            searchPredicate={(event, query) =>
              [
                event.source,
                event.reference ?? "",
                event.processingOutcome ?? "",
                event.transactionStatus ?? "",
                event.providerEventType ?? "",
                event.errorMessage ?? "",
              ].some((value) => value.toLowerCase().includes(query))
            }
            selectedRowId={selectedEventId}
            onSelectRow={setSelectedEventId}
            toolbar={
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F2651]" htmlFor="payment-source-filter">
                    Source
                  </label>
                  <select
                    id="payment-source-filter"
                    value={sourceFilter}
                    onChange={(event) => setSourceFilter(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                  >
                    {sourceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === "all" ? "All sources" : option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F2651]" htmlFor="payment-outcome-filter">
                    Processing Outcome
                  </label>
                  <select
                    id="payment-outcome-filter"
                    value={outcomeFilter}
                    onChange={(event) => setOutcomeFilter(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                  >
                    {outcomeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === "all" ? "All outcomes" : option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F2651]" htmlFor="payment-date-from">
                    Created From
                  </label>
                  <Input
                    id="payment-date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F2651]" htmlFor="payment-date-to">
                    Created To
                  </label>
                  <Input
                    id="payment-date-to"
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button asChild variant="outline" className="w-full">
                    <a href="/admin/payments/export">
                      <Download className="h-4 w-4" />
                      Export CSV
                    </a>
                  </Button>
                </div>
              </div>
            }
            renderMobileCard={(event) => {
              const retryKey = `${event.reference ?? event.id}:${event.source}`;
              const retryCount = retryCounts[retryKey] ?? 1;

              return (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-slate-100 text-slate-700">{event.source}</Badge>
                    <Badge className="bg-blue-100 text-blue-800">
                      {event.processingOutcome ?? "No outcome"}
                    </Badge>
                    {event.transactionStatus ? (
                      <Badge className="bg-amber-100 text-amber-800">
                        {event.transactionStatus}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="break-all text-sm font-medium text-[#0F2651]">
                    {event.reference ?? "No reference"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {event.providerEventType ?? "No provider event type"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Attempts: {retryCount} · {formatAdminDateTime(event.createdAt)}
                  </p>
                  {event.errorMessage ? (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      {event.errorMessage}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedEventId(event.id)}
                  >
                    Review Event
                  </Button>
                </div>
              );
            }}
          />
        </CardContent>
      </Card>

      {selectedEvent ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Selected Payment Event</CardTitle>
              <CardDescription>
                Investigate the event, retry verification, or mark it for manual follow-up.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Source
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#0F2651]">{selectedEvent.source}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#0F2651]">
                    {formatCurrency(selectedEvent.amountKobo, selectedEvent.currency)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Environment
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#0F2651]">
                    {selectedEvent.providerEnvironment ?? "Not available"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reference
                  </p>
                  <p className="mt-1 break-all text-sm font-medium text-[#0F2651]">
                    {selectedEvent.reference ?? "Not available"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Checkout Session
                  </p>
                  <p className="mt-1 break-all text-sm font-medium text-[#0F2651]">
                    {selectedEvent.checkoutSessionId ?? "Not available"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Processed
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#0F2651]">
                    {selectedEvent.processedAt
                      ? formatAdminDateTime(selectedEvent.processedAt)
                      : "Pending processing"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="bg-slate-100 text-slate-700">
                  {selectedEvent.provider}
                </Badge>
                <Badge className="bg-blue-100 text-blue-800">
                  {selectedEvent.processingOutcome ?? "No outcome"}
                </Badge>
                {selectedEvent.transactionStatus ? (
                  <Badge className="bg-amber-100 text-amber-800">
                    {selectedEvent.transactionStatus}
                  </Badge>
                ) : null}
                {selectedEvent.signatureValid === false ? (
                  <Badge className="bg-red-100 text-red-800">Invalid signature</Badge>
                ) : selectedEvent.signatureValid === true ? (
                  <Badge className="bg-green-100 text-green-800">Signature verified</Badge>
                ) : null}
              </div>

              {selectedEvent.errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                  <p className="font-semibold">Error message</p>
                  <p className="mt-2 whitespace-pre-wrap">{selectedEvent.errorMessage}</p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <form
                  action={retryPaymentVerificationAction}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <input type="hidden" name="redirect_to" value="/admin/payments" />
                  <input type="hidden" name="payment_event_id" value={selectedEvent.id} />
                  <input type="hidden" name="reference" value={selectedEvent.reference ?? ""} />
                  <p className="text-sm font-medium text-[#0F2651]">Retry verification</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Re-run checkout finalization for this reference to recover a missed callback or webhook.
                  </p>
                  <Button
                    type="submit"
                    className="mt-4 bg-[#36689e] text-white hover:bg-[#0F2651]"
                    disabled={!selectedEvent.reference}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Retry Verification
                  </Button>
                </form>

                <form
                  action={updatePaymentReviewAction}
                  className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <input type="hidden" name="redirect_to" value="/admin/payments" />
                  <input type="hidden" name="payment_event_id" value={selectedEvent.id} />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0F2651]" htmlFor={`review-status-${selectedEvent.id}`}>
                      Review Action
                    </label>
                    <select
                      id={`review-status-${selectedEvent.id}`}
                      name="review_status"
                      defaultValue="admin_follow_up"
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#36689e]"
                    >
                      <option value="admin_follow_up">Mark for follow-up</option>
                      <option value="admin_reconciled">Mark reconciled</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0F2651]" htmlFor={`review-note-${selectedEvent.id}`}>
                      Admin Note
                    </label>
                    <Textarea
                      id={`review-note-${selectedEvent.id}`}
                      name="review_note"
                      placeholder="Optional reconciliation note for the audit trail"
                      rows={4}
                    />
                  </div>
                  <Button type="submit" variant="outline">
                    Save Review
                  </Button>
                </form>
              </div>

              <Card className="border-slate-200 bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-base text-[#0F2651]">Retry Timeline</CardTitle>
                  <CardDescription>
                    Related attempts for this same reference and source.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {relatedEvents.length === 0 ? (
                    <p className="text-sm text-slate-500">No related attempts recorded.</p>
                  ) : (
                    relatedEvents.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-[#0F2651]">
                              {event.processingOutcome ?? "No outcome"} · {event.source}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {event.providerEventType ?? "No provider event type"}
                            </p>
                          </div>
                          <p className="text-xs text-slate-500">
                            {formatAdminDateTime(event.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <AdminAuditLogList
            logs={selectedAuditLogs}
            title="Payment Audit Activity"
            description="Admin actions recorded for this payment event."
            emptyStateMessage="No admin audit activity recorded yet for this payment event."
          />
        </div>
      ) : null}

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-[#0F2651]">Latest Subscription Records</CardTitle>
          <CardDescription>
            Most recently created property coverages across the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <AdminDataTable
            columns={coverageColumns}
            data={recentCoverages}
            entityLabel="subscription records"
            searchPlaceholder="Search subscriptions by plan, property, or owner"
            emptyStateTitle="No subscription records available yet"
            emptyStateDescription="Property subscription records will appear here as users activate or renew plans."
            searchPredicate={(coverage, query) =>
              [
                coverage.planName,
                coverage.status,
                coverage.propertyName,
                coverage.userName,
                coverage.userEmail,
              ].some((value) => value.toLowerCase().includes(query))
            }
            renderMobileCard={(coverage) => (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-[#0F2651] text-white">{coverage.planName}</Badge>
                  <Badge className="bg-slate-100 text-slate-700">{coverage.status}</Badge>
                </div>
                <p className="text-sm font-semibold text-[#0F2651]">{coverage.propertyName}</p>
                <p className="text-xs text-slate-500">
                  {coverage.userName} · {coverage.userEmail}
                </p>
                <p className="text-xs text-slate-500">
                  Started {formatAdminDateTime(coverage.startsAt)}
                </p>
                <p className="text-xs text-slate-500">
                  Expires{" "}
                  {coverage.expiresAt ? formatAdminDateTime(coverage.expiresAt) : "No expiry"}
                </p>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
