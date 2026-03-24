export const PROPERTY_TYPES = [
  "Vehicle",
  "Electronics",
  "Jewelry",
  "Other",
] as const;

export type PropertyTypeValue = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_STATUSES = ["Active", "Flagged", "Stolen"] as const;

export type PropertyStatusValue = (typeof PROPERTY_STATUSES)[number];

export const SUBSCRIPTION_PERIODS = ["monthly", "yearly"] as const;

export type SubscriptionPeriodValue = (typeof SUBSCRIPTION_PERIODS)[number];

export const SUBSCRIPTION_STATUSES = [
  "active",
  "cancelled",
  "expired",
] as const;

export type SubscriptionStatusValue =
  (typeof SUBSCRIPTION_STATUSES)[number];

export const STOLEN_REPORT_STATUSES = [
  "Reported",
  "UnderInvestigation",
  "Resolved",
] as const;

export type StolenReportStatusValue =
  (typeof STOLEN_REPORT_STATUSES)[number];

export const STOLEN_REPORT_STATUS_LABELS: Record<
  StolenReportStatusValue,
  string
> = {
  Reported: "Reported",
  UnderInvestigation: "Under Investigation",
  Resolved: "Resolved",
};

export const DEFAULT_PROPERTY_STATUS: PropertyStatusValue = "Active";
export const DEFAULT_STOLEN_REPORT_STATUS: StolenReportStatusValue =
  "Reported";

export function isPropertyType(value: unknown): value is PropertyTypeValue {
  return (
    typeof value === "string" &&
    PROPERTY_TYPES.includes(value as PropertyTypeValue)
  );
}

export function isPropertyStatus(
  value: unknown,
): value is PropertyStatusValue {
  return (
    typeof value === "string" &&
    PROPERTY_STATUSES.includes(value as PropertyStatusValue)
  );
}

export function isStolenReportStatus(
  value: unknown,
): value is StolenReportStatusValue {
  return (
    typeof value === "string" &&
    STOLEN_REPORT_STATUSES.includes(value as StolenReportStatusValue)
  );
}

export function getStolenReportStatusLabel(value: string): string {
  if (isStolenReportStatus(value)) {
    return STOLEN_REPORT_STATUS_LABELS[value];
  }

  return value;
}

export function normalizeStoredPhotoUrl(url: string): string {
  if (url.startsWith("/api/uploads/")) {
    return url.replace("/api/uploads/", "/uploads/");
  }

  return url;
}

export function extractFileNameFromUrl(fileUrl: string): string {
  try {
    const parsed = new URL(fileUrl, "http://localhost");
    return decodeURIComponent(parsed.pathname.split("/").pop() || "upload");
  } catch {
    return decodeURIComponent(fileUrl.split("/").pop() || "upload");
  }
}
