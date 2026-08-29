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

  /**
   * Wallet and referral values. Mirrored from lib/wallet.ts and
   * lib/referrals.ts rather than imported, so the legal pages do not pull the
   * Prisma client into the module graph of every page that renders the footer.
   * Keep in sync if those constants change.
   */
  walletCreditValueLabel: "NGN 1",
  walletCreditExpiryLabel: "12 months from the date it is credited",
  walletExpiryWarningDays: 30,
  walletTransferMinCredits: 1,
  walletTransferMaxCredits: 500,
  walletTransferDailyLimitCredits: 1000,
  referralMilestones: [
    { target: 5, rewardCredits: 7, badge: null },
    { target: 20, rewardCredits: 30, badge: null },
    { target: 100, rewardCredits: 200, badge: "Catcher Ambassador" },
  ],
} as const;
