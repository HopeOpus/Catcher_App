import {
  FREE_PROPERTY_PLAN_LIFETIME_LIMIT,
  MONTHLY_PROPERTY_PLAN_PRICE_NGN_KOBO,
  PROPERTY_PLAN_GRACE_PERIOD_DAYS,
  YEARLY_PROPERTY_PLAN_PRICE_NGN_KOBO,
  formatNgnFromKobo,
  getPropertyPlanDefinition,
} from "@/lib/property-plans";

/**
 * Product facts referenced by the legal documents. These are derived from the
 * live plan configuration so the published policies cannot drift away from
 * what Catcher actually charges and enforces.
 */
export const LEGAL_FACTS = {
  monthlyPrice: formatNgnFromKobo(MONTHLY_PROPERTY_PLAN_PRICE_NGN_KOBO),
  yearlyPrice: formatNgnFromKobo(YEARLY_PROPERTY_PLAN_PRICE_NGN_KOBO),
  monthlyDurationDays: getPropertyPlanDefinition("monthly").durationDays ?? 30,
  yearlyDurationDays: getPropertyPlanDefinition("yearly").durationDays ?? 365,
  gracePeriodDays: PROPERTY_PLAN_GRACE_PERIOD_DAYS,
  freePlanLifetimeLimit: FREE_PROPERTY_PLAN_LIFETIME_LIMIT,
  maxUploadSizeLabel: "5 MB",
  allowedUploadTypesLabel: "JPEG, PNG, GIF and WebP images",
  publicLookupRateLimitLabel: "120 requests every 5 minutes per visitor",
} as const;
