/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PROPERTY_TYPES } from "@/lib/catcher-domain";
import {
  buildPublicRegistryQueryString,
  buildPublicRegistryHref,
  type PublicRegistryPropertyTypeFilter,
  type PublicRegistrySearchResult,
  type PublicRegistrySort,
  type PublicRegistryStatusFilter,
} from "@/lib/public-registry";

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getOwnerInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "CU";
}

function getPropertyStatusClasses(status: string) {
  switch (status) {
    case "Stolen":
      return "bg-red-100 text-red-800";
    case "Flagged":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-green-100 text-green-800";
  }
}

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  const maxButtons = 5;
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + maxButtons - 1);
  const adjustedStart = Math.max(1, end - maxButtons + 1);

  return Array.from(
    { length: end - adjustedStart + 1 },
    (_, index) => adjustedStart + index,
  );
}

export function RegistryExplorer({
  result,
  hasSearched,
}: {
  result: PublicRegistrySearchResult;
  hasSearched: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = React.useState(result.state.q);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setQuery(result.state.q);
  }, [result.state.q]);

  const navigateToRegistryState = React.useCallback(
    (overrides: {
      q?: string;
      status?: PublicRegistryStatusFilter;
      propertyType?: PublicRegistryPropertyTypeFilter;
      sort?: PublicRegistrySort;
      page?: number;
    }) => {
      const href = buildPublicRegistryHref(
        {
          q: overrides.q ?? result.state.q,
          status: overrides.status ?? result.state.status,
          propertyType: overrides.propertyType ?? result.state.propertyType,
          sort: overrides.sort ?? result.state.sort,
          page: overrides.page ?? result.state.page,
        },
        pathname || "/search-registry",
      );

      startTransition(() => {
        router.push(href, { scroll: false });
      });
    },
    [
      pathname,
      result.state.page,
      result.state.propertyType,
      result.state.q,
      result.state.sort,
      result.state.status,
      router,
    ],
  );

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return;
    }

    navigateToRegistryState({
      q: normalizedQuery,
      page: 1,
    });
  };

  const clearSearch = () => {
    setQuery("");
    navigateToRegistryState({
      q: "",
      page: 1,
    });
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    navigateToRegistryState({
      sort: event.target.value as PublicRegistrySort,
      page: 1,
    });
  };

  const applyStatusFilter = (nextFilter: PublicRegistryStatusFilter) => {
    navigateToRegistryState({
      status: nextFilter,
      page: 1,
    });
  };

  const handlePropertyTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    navigateToRegistryState({
      propertyType: event.target.value as PublicRegistryPropertyTypeFilter,
      page: 1,
    });
  };

  const goToPage = (page: number) => {
    navigateToRegistryState({
      page,
    });
  };

  const visiblePageNumbers = getVisiblePageNumbers(
    result.page,
    result.totalPages,
  );
  const hasSearchQuery = result.state.q.length > 0;
  const hasResults = result.totalCount > 0;
  const isSearchActionDisabled = isPending || query.trim().length === 0;
  const detailQueryString = buildPublicRegistryQueryString({
    q: result.state.q,
    status: result.state.status,
    propertyType: result.state.propertyType,
    sort: result.state.sort,
    page: result.page,
  });

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="max-w-3xl space-y-2">
            <h2 className="text-xl font-semibold text-[#0F2651]">
              Search Registry
            </h2>
            <p className="text-sm text-slate-600">
              Search by item name, serial number, location, theft report description, or status.
              Every result shows the registrant&apos;s name, photo, phone number, email, and
              whether the property has been reported stolen.
            </p>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_200px_220px_auto] xl:items-end"
          >
            <div className="relative md:col-span-2 xl:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by item name, serial number, location, report details, or status"
                className="h-12 rounded-2xl border-slate-300 pl-10 pr-12"
              />
              {query ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              ) : null}
            </div>

            <select
              value={result.state.propertyType}
              onChange={handlePropertyTypeChange}
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#36689e] focus:ring-2 focus:ring-[#36689e]/20"
            >
              <option value="all">All property types</option>
              {PROPERTY_TYPES.map((propertyType) => (
                <option key={propertyType} value={propertyType}>
                  {propertyType}
                </option>
              ))}
            </select>

            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={result.state.sort}
                onChange={handleSortChange}
                className="h-12 w-full appearance-none rounded-2xl border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#36689e] focus:ring-2 focus:ring-[#36689e]/20"
              >
                <option value="newest">Newest</option>
                <option value="name-asc">Name A-Z</option>
                <option value="reported-stolen">Reported Stolen First</option>
              </select>
              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-[#36689e] px-5 text-white hover:bg-[#0F2651] md:col-span-2 xl:col-span-1 xl:w-auto"
              disabled={isSearchActionDisabled}
            >
              {isPending ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Updating
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {hasSearched
              ? `Showing ${result.totalCount} registry record${result.totalCount === 1 ? "" : "s"} for "${result.state.q}".`
              : "Enter an item name, serial number, location, report detail, or status to search the registry."}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sorted by{" "}
              <span className="text-[#0F2651]">
                {result.state.sort === "newest"
                  ? "Newest"
                  : result.state.sort === "name-asc"
                    ? "Name A-Z"
                    : "Reported Stolen First"}
              </span>
            </span>
            {hasSearchQuery ? (
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-[#36689e]"
                onClick={clearSearch}
              >
                Clear search
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Search Tips
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              "Toyota Camry",
              "Vehicle",
              "serial number",
              "Lagos",
              "Reported",
              "Under Investigation",
            ].map((tip) => (
              <span
                key={tip}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
              >
                {tip}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Try combining a search term with a property type or stolen-status filter to narrow the
            registry quickly.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={result.state.status === "all" ? "default" : "outline"}
            className={
              result.state.status === "all"
                ? "bg-[#36689e] text-white hover:bg-[#0F2651]"
                : "border-slate-300 text-slate-700"
            }
            onClick={() => applyStatusFilter("all")}
            disabled={isPending}
          >
            All
          </Button>
          <Button
            type="button"
            variant={result.state.status === "reported-stolen" ? "default" : "outline"}
            className={
              result.state.status === "reported-stolen"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "border-red-200 text-red-700 hover:bg-red-50"
            }
            onClick={() => applyStatusFilter("reported-stolen")}
            disabled={isPending}
          >
            Reported Stolen
          </Button>
          <Button
            type="button"
            variant={result.state.status === "not-reported-stolen" ? "default" : "outline"}
            className={
              result.state.status === "not-reported-stolen"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "border-green-200 text-green-700 hover:bg-green-50"
            }
            onClick={() => applyStatusFilter("not-reported-stolen")}
            disabled={isPending}
          >
            Not Reported Stolen
          </Button>
          {(hasSearchQuery ||
            result.state.status !== "all" ||
            result.state.propertyType !== "all" ||
            result.state.sort !== "newest") ? (
            <Button
              type="button"
              variant="ghost"
              className="text-[#36689e] hover:text-[#0F2651]"
              onClick={() =>
                navigateToRegistryState({
                  q: "",
                  status: "all",
                  propertyType: "all",
                  sort: "newest",
                  page: 1,
                })
              }
              disabled={isPending}
            >
              Reset search
            </Button>
          ) : null}
        </div>
      </div>

      {!hasSearched ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <Search className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h2 className="text-2xl font-semibold text-[#0F2651]">Search the public registry</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            No property records are shown by default. Enter a search term above to look up a
            registered item and see the matching registry result.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-500">
            You can search by item name, serial number, location, report description, or status.
          </p>
        </div>
      ) : !hasResults ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h2 className="text-2xl font-semibold text-[#0F2651]">No matching registry records found</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            No live property records matched this exact search, filter, and sort combination.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              type="button"
              className="bg-[#36689e] text-white hover:bg-[#0F2651]"
              onClick={() =>
                navigateToRegistryState({
                  q: "",
                  status: "all",
                  propertyType: "all",
                  sort: "newest",
                  page: 1,
                })
              }
            >
              Start a new search
            </Button>
            <p className="text-sm text-slate-500">
              Tip: search by property type, owner detail, serial number, location, or theft status.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing records{" "}
              <span className="font-medium text-[#0F2651]">
                {result.rangeStart}-{result.rangeEnd}
              </span>{" "}
              of{" "}
              <span className="font-medium text-[#0F2651]">{result.totalCount}</span>.
            </p>
            <p className="flex items-center gap-2">
              Page <span className="font-medium text-[#0F2651]">{result.page}</span> of{" "}
              <span className="font-medium text-[#0F2651]">{result.totalPages}</span>
              {isPending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#36689e]" />
                  <span>Updating results</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="space-y-5">
            {result.items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="relative min-h-[220px] bg-slate-100 md:w-56 md:flex-shrink-0 lg:w-64">
                    {item.propertyImageUrl ? (
                      <img
                        src={item.propertyImageUrl}
                        alt={item.propertyName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-6 text-center text-sm font-medium text-slate-500">
                        No property image available
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-5 p-5 md:p-6 lg:flex-row lg:items-stretch lg:gap-6">
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={getPropertyStatusClasses(item.propertyStatus)}>
                              {item.propertyStatus}
                            </Badge>
                            <Badge
                              className={
                                item.isReportedStolen
                                  ? "border-none bg-red-100 text-red-800"
                                  : "border-none bg-green-100 text-green-800"
                              }
                            >
                              {item.isReportedStolen ? "Reported Stolen" : "Not Reported Stolen"}
                            </Badge>
                          </div>
                          <h3 className="text-2xl font-semibold tracking-tight text-[#0F2651]">
                            {item.propertyName}
                          </h3>
                        </div>
                        <div className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                          Registered {formatDate(item.dateRegistered)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                        <span>
                          Type <span className="font-medium text-[#0F2651]">{item.propertyType}</span>
                        </span>
                        <span>
                          Serial{" "}
                          <span className="font-medium text-[#0F2651]">{item.serialNumber}</span>
                        </span>
                        <span>
                          Reports{" "}
                          <span className="font-medium text-[#0F2651]">{item.stolenReportCount}</span>
                        </span>
                      </div>

                      <p className="line-clamp-2 text-sm leading-7 text-slate-600">
                        {item.propertyDescription || "No additional property description was provided."}
                      </p>

                      {item.isReportedStolen ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                            <div className="min-w-0 space-y-2">
                              <p className="font-semibold text-red-800">
                                Reported stolen
                                {item.latestReportStatus ? ` · ${item.latestReportStatus}` : ""}
                              </p>
                              <div className="flex flex-wrap gap-4 text-sm text-red-700">
                                {item.latestReportDate ? (
                                  <span className="inline-flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(item.latestReportDate)}
                                  </span>
                                ) : null}
                                {item.latestReportLocation ? (
                                  <span className="inline-flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {item.latestReportLocation}
                                  </span>
                                ) : null}
                              </div>
                              <p className="line-clamp-2 text-sm text-red-700">
                                {item.latestReportDescription ||
                                  `This property has ${item.stolenReportCount} theft report${item.stolenReportCount === 1 ? "" : "s"} on file.`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-4">
                          <div className="flex items-start gap-3">
                            <ShieldCheck className="mt-0.5 h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-semibold text-green-800">No theft report on file</p>
                              <p className="mt-1 text-sm text-green-700">
                                This public registry record currently has no stolen-property report attached.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:w-[280px] lg:flex-shrink-0 lg:self-stretch">
                      <div className="flex items-start gap-3">
                        {item.ownerImageUrl ? (
                          <img
                            src={item.ownerImageUrl}
                            alt={item.ownerName}
                            className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#36689e]/10 text-sm font-semibold text-[#0F2651] ring-2 ring-white">
                            {getOwnerInitials(item.ownerName)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Registrant
                          </p>
                          <p className="mt-1 text-base font-semibold text-[#0F2651]">
                            {item.ownerName}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3 text-sm text-slate-600">
                        <a
                          href={`mailto:${item.ownerEmail}`}
                          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-[#36689e]/40 hover:text-[#0F2651]"
                        >
                          <Mail className="h-4 w-4 flex-shrink-0 text-[#36689e]" />
                          <span className="truncate">{item.ownerEmail}</span>
                        </a>
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <Phone className="h-4 w-4 flex-shrink-0 text-[#36689e]" />
                          {item.ownerPhone ? (
                            <a
                              href={`tel:${item.ownerPhone}`}
                              className="truncate transition-colors hover:text-[#0F2651]"
                            >
                              {item.ownerPhone}
                            </a>
                          ) : (
                            <span className="truncate">Phone number not available</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        <Link
                          href={
                            detailQueryString
                              ? `/search-registry/${item.id}?${detailQueryString}`
                              : `/search-registry/${item.id}`
                          }
                          className="inline-flex w-full items-center justify-center rounded-2xl bg-[#36689e] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0F2651]"
                        >
                          <UserRound className="mr-2 h-4 w-4" />
                          View Registry Details
                        </Link>
                        <p className="text-xs leading-6 text-slate-500">
                          Use the detail page to review the full property record, owner details,
                          and theft-report history.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {result.totalPages > 1 ? (
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Move through registry pages to review more property records.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-300"
                  onClick={() => goToPage(Math.max(1, result.page - 1))}
                  disabled={result.page === 1 || isPending}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {visiblePageNumbers.map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    type="button"
                    variant={pageNumber === result.page ? "default" : "outline"}
                    className={
                      pageNumber === result.page
                        ? "bg-[#36689e] text-white hover:bg-[#0F2651]"
                        : "border-slate-300"
                    }
                    onClick={() => goToPage(pageNumber)}
                    disabled={isPending}
                  >
                    {pageNumber}
                  </Button>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-300"
                  onClick={() => goToPage(Math.min(result.totalPages, result.page + 1))}
                  disabled={result.page === result.totalPages || isPending}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
