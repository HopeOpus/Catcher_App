import type { PropertyTypeValue } from "@/lib/catcher-domain";

export const PUBLIC_REGISTRY_PAGE_SIZE = 6;

export const PUBLIC_REGISTRY_STATUS_FILTERS = [
  "all",
  "reported-stolen",
  "not-reported-stolen",
] as const;

export const PUBLIC_REGISTRY_SORT_OPTIONS = [
  "newest",
  "name-asc",
  "reported-stolen",
] as const;

export const PUBLIC_REGISTRY_PROPERTY_TYPE_FILTERS = [
  "all",
  "Vehicle",
  "Electronics",
  "Jewelry",
  "Document",
  "Other",
] as const;

export type PublicRegistryStatusFilter =
  (typeof PUBLIC_REGISTRY_STATUS_FILTERS)[number];

export type PublicRegistrySort = (typeof PUBLIC_REGISTRY_SORT_OPTIONS)[number];

export type PublicRegistryPropertyTypeFilter =
  | "all"
  | PropertyTypeValue;

export type PublicRegistryItem = {
  id: string;
  propertyName: string;
  propertyType: string;
  propertyStatus: string;
  serialNumber: string;
  propertyDescription: string;
  dateRegistered: string;
  propertyImageUrl: string | null;
  ownerName: string;
  /**
   * Owner contact details are only serialized for signed-in viewers. For
   * anonymous visitors these are null so the public registry cannot be used to
   * harvest registrant contact data.
   */
  ownerEmail: string | null;
  ownerPhone: string | null;
  ownerImageUrl: string | null;
  isReportedStolen: boolean;
  latestReportStatus: string | null;
  latestReportLocation: string;
  latestReportDescription: string;
  latestReportDate: string | null;
  stolenReportCount: number;
};

export type PublicRegistrySearchState = {
  q: string;
  status: PublicRegistryStatusFilter;
  propertyType: PublicRegistryPropertyTypeFilter;
  sort: PublicRegistrySort;
  page: number;
  pageSize: number;
};

export type PublicRegistrySearchResult = {
  items: PublicRegistryItem[];
  /** True when the viewer is signed in and owner contact details were included. */
  canViewOwnerContact: boolean;
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  rangeStart: number;
  rangeEnd: number;
  state: PublicRegistrySearchState;
};

type RegistrySearchParamsRecord = Record<
  string,
  string | string[] | undefined
>;

export type PublicRegistryPageSearchParams = Promise<RegistrySearchParamsRecord>;

function getFirstSearchParamValue(
  input: RegistrySearchParamsRecord | URLSearchParams | null | undefined,
  key: string,
) {
  if (!input) {
    return null;
  }

  if (input instanceof URLSearchParams) {
    return input.get(key);
  }

  const value = input[key];

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return null;
}

export function normalizePublicRegistryStatusFilter(
  value: string | null | undefined,
): PublicRegistryStatusFilter {
  if (
    typeof value === "string" &&
    PUBLIC_REGISTRY_STATUS_FILTERS.includes(
      value as PublicRegistryStatusFilter,
    )
  ) {
    return value as PublicRegistryStatusFilter;
  }

  return "all";
}

export function normalizePublicRegistrySort(
  value: string | null | undefined,
): PublicRegistrySort {
  if (
    typeof value === "string" &&
    PUBLIC_REGISTRY_SORT_OPTIONS.includes(value as PublicRegistrySort)
  ) {
    return value as PublicRegistrySort;
  }

  return "newest";
}

export function normalizePublicRegistryPropertyTypeFilter(
  value: string | null | undefined,
): PublicRegistryPropertyTypeFilter {
  if (
    typeof value === "string" &&
    PUBLIC_REGISTRY_PROPERTY_TYPE_FILTERS.includes(
      value as PublicRegistryPropertyTypeFilter,
    )
  ) {
    return value as PublicRegistryPropertyTypeFilter;
  }

  return "all";
}

export function parsePublicRegistrySearchParams(
  searchParams?: RegistrySearchParamsRecord | URLSearchParams | null,
): PublicRegistrySearchState {
  const rawQuery = getFirstSearchParamValue(searchParams, "q") ?? "";
  const rawStatus = getFirstSearchParamValue(searchParams, "status");
  const rawPropertyType = getFirstSearchParamValue(searchParams, "type");
  const rawSort = getFirstSearchParamValue(searchParams, "sort");
  const rawPage = getFirstSearchParamValue(searchParams, "page");
  const parsedPage = Number.parseInt(rawPage ?? "1", 10);

  return {
    q: rawQuery.trim(),
    status: normalizePublicRegistryStatusFilter(rawStatus),
    propertyType: normalizePublicRegistryPropertyTypeFilter(rawPropertyType),
    sort: normalizePublicRegistrySort(rawSort),
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    pageSize: PUBLIC_REGISTRY_PAGE_SIZE,
  };
}

export function buildPublicRegistryQueryString(
  state: Partial<
    Pick<PublicRegistrySearchState, "q" | "status" | "propertyType" | "sort" | "page">
  >,
) {
  const params = new URLSearchParams();
  const query = state.q?.trim() ?? "";
  const status = normalizePublicRegistryStatusFilter(state.status);
  const propertyType = normalizePublicRegistryPropertyTypeFilter(state.propertyType);
  const sort = normalizePublicRegistrySort(state.sort);
  const page =
    typeof state.page === "number" && Number.isFinite(state.page) && state.page > 1
      ? Math.floor(state.page)
      : 1;

  if (query.length > 0) {
    params.set("q", query);
  }

  if (status !== "all") {
    params.set("status", status);
  }

  if (propertyType !== "all") {
    params.set("type", propertyType);
  }

  if (sort !== "newest") {
    params.set("sort", sort);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  return params.toString();
}

export function buildPublicRegistryHref(
  state: Partial<
    Pick<PublicRegistrySearchState, "q" | "status" | "propertyType" | "sort" | "page">
  >,
  pathname = "/search-registry",
) {
  const queryString = buildPublicRegistryQueryString(state);

  return queryString ? `${pathname}?${queryString}` : pathname;
}
