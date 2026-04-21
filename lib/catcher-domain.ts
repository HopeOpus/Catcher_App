export const PROPERTY_TYPES = [
  "Vehicle",
  "Electronics",
  "Jewelry",
  "Document",
  "Other",
] as const;

export type PropertyTypeValue = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_STATUSES = ["Active", "Flagged", "Stolen"] as const;

export type PropertyStatusValue = (typeof PROPERTY_STATUSES)[number];

// Legacy mobile app statuses from the Supabase-backed schema.
// We keep the mapping here so the shared backend schema remains canonical
// while mobile transitions from safe/stolen/unknown to Active/Flagged/Stolen.
export const LEGACY_MOBILE_PROPERTY_STATUSES = [
  "safe",
  "stolen",
  "unknown",
] as const;

export type LegacyMobilePropertyStatusValue =
  (typeof LEGACY_MOBILE_PROPERTY_STATUSES)[number];

export const LEGACY_MOBILE_TO_PROPERTY_STATUS: Record<
  LegacyMobilePropertyStatusValue,
  PropertyStatusValue
> = {
  safe: "Active",
  stolen: "Stolen",
  unknown: "Flagged",
};

export const PROPERTY_STATUS_TO_LEGACY_MOBILE: Record<
  PropertyStatusValue,
  LegacyMobilePropertyStatusValue
> = {
  Active: "safe",
  Stolen: "stolen",
  Flagged: "unknown",
};

export const SUBSCRIPTION_PERIODS = ["monthly", "yearly"] as const;

export type SubscriptionPeriodValue = (typeof SUBSCRIPTION_PERIODS)[number];

export const SUBSCRIPTION_STATUSES = [
  "active",
  "cancelled",
  "expired",
] as const;

export type SubscriptionStatusValue =
  (typeof SUBSCRIPTION_STATUSES)[number];

export const PROPERTY_PLAN_CODES = ["free", "monthly", "yearly"] as const;

export type PropertyPlanCodeValue = (typeof PROPERTY_PLAN_CODES)[number];

export const PROPERTY_PLAN_LABELS: Record<PropertyPlanCodeValue, string> = {
  free: "Free",
  monthly: "Monthly",
  yearly: "Yearly",
};

export const PROPERTY_COVERAGE_STATUSES = [
  "scheduled",
  "active",
  "grace",
  "archived",
  "cancelled",
] as const;

export type PropertyCoverageStatusValue =
  (typeof PROPERTY_COVERAGE_STATUSES)[number];

export const PROPERTY_CHECKOUT_SESSION_STATUSES = [
  "draft",
  "pendingPayment",
  "pendingVerification",
  "completed",
  "expired",
  "cancelled",
] as const;

export type PropertyCheckoutSessionStatusValue =
  (typeof PROPERTY_CHECKOUT_SESSION_STATUSES)[number];

export const PAYMENT_CURRENCIES = ["USD", "NGN"] as const;

export type PaymentCurrencyValue = (typeof PAYMENT_CURRENCIES)[number];

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

export function isLegacyMobilePropertyStatus(
  value: unknown,
): value is LegacyMobilePropertyStatusValue {
  return (
    typeof value === "string" &&
    LEGACY_MOBILE_PROPERTY_STATUSES.includes(
      value as LegacyMobilePropertyStatusValue,
    )
  );
}

export function mapLegacyMobilePropertyStatus(
  value: LegacyMobilePropertyStatusValue,
): PropertyStatusValue {
  return LEGACY_MOBILE_TO_PROPERTY_STATUS[value];
}

export function mapPropertyStatusToLegacyMobile(
  value: PropertyStatusValue,
): LegacyMobilePropertyStatusValue {
  return PROPERTY_STATUS_TO_LEGACY_MOBILE[value];
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

export function isPropertyPlanCode(
  value: unknown,
): value is PropertyPlanCodeValue {
  return (
    typeof value === "string" &&
    PROPERTY_PLAN_CODES.includes(value as PropertyPlanCodeValue)
  );
}

export function isPropertyCoverageStatus(
  value: unknown,
): value is PropertyCoverageStatusValue {
  return (
    typeof value === "string" &&
    PROPERTY_COVERAGE_STATUSES.includes(value as PropertyCoverageStatusValue)
  );
}

export function isPropertyCheckoutSessionStatus(
  value: unknown,
): value is PropertyCheckoutSessionStatusValue {
  return (
    typeof value === "string" &&
    PROPERTY_CHECKOUT_SESSION_STATUSES.includes(
      value as PropertyCheckoutSessionStatusValue,
    )
  );
}

export function isPaymentCurrency(
  value: unknown,
): value is PaymentCurrencyValue {
  return (
    typeof value === "string" &&
    PAYMENT_CURRENCIES.includes(value as PaymentCurrencyValue)
  );
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
