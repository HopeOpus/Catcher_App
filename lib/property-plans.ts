import type { PropertyPlanCodeValue } from "@/lib/catcher-domain";

export const MONTHLY_PROPERTY_PLAN_PRICE_NGN_KOBO = 80000;
export const YEARLY_PROPERTY_PLAN_PRICE_NGN_KOBO = 500000;
export const PROPERTY_PLAN_GRACE_PERIOD_DAYS = 7;
export const FREE_PROPERTY_PLAN_LIFETIME_LIMIT = 1;

export type PropertyPlanDefinition = {
  code: PropertyPlanCodeValue;
  name: string;
  description: string;
  priceNgnKobo: number;
  durationDays: number | null;
  buttonLabel: string;
  badge?: string;
};

export const PROPERTY_PLAN_DEFINITIONS: readonly PropertyPlanDefinition[] = [
  {
    code: "free",
    name: "Free",
    description:
      "One lifetime free property registration per account. Public stolen reporting stays available.",
    priceNgnKobo: 0,
    durationDays: null,
    buttonLabel: "Activate Free Subscription",
  },
  {
    code: "monthly",
    name: "Monthly",
    description:
      "Pay per property for 30 days of active protection, followed by a 7-day grace period before archive.",
    priceNgnKobo: MONTHLY_PROPERTY_PLAN_PRICE_NGN_KOBO,
    durationDays: 30,
    buttonLabel: "Continue to Payment",
  },
  {
    code: "yearly",
    name: "Yearly",
    description:
      "Pay per property for 365 days of active protection, followed by a 7-day grace period before archive.",
    priceNgnKobo: YEARLY_PROPERTY_PLAN_PRICE_NGN_KOBO,
    durationDays: 365,
    buttonLabel: "Continue to Payment",
    badge: "Best value",
  },
] as const;

const PROPERTY_PLAN_MAP = new Map(
  PROPERTY_PLAN_DEFINITIONS.map((plan) => [plan.code, plan]),
);

export function getPropertyPlanDefinition(
  planCode: PropertyPlanCodeValue,
): PropertyPlanDefinition {
  const plan = PROPERTY_PLAN_MAP.get(planCode);

  if (!plan) {
    throw new Error(`Unknown property plan: ${planCode}`);
  }

  return plan;
}

export function formatNgnFromKobo(amountKobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amountKobo / 100);
}

function addDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function buildPropertyCoverageWindow(options: {
  planCode: PropertyPlanCodeValue;
  settledAt: Date;
  renewFromExpiresAt?: Date | null;
}) {
  const { planCode, settledAt, renewFromExpiresAt = null } = options;
  const plan = getPropertyPlanDefinition(planCode);
  const shouldExtendFromExistingExpiry =
    renewFromExpiresAt instanceof Date &&
    renewFromExpiresAt.getTime() > settledAt.getTime();
  const startsAt = shouldExtendFromExistingExpiry
    ? renewFromExpiresAt
    : settledAt;

  if (plan.durationDays === null) {
    return {
      startsAt,
      expiresAt: null,
      graceEndsAt: null,
    };
  }

  const expiresAt = addDays(startsAt, plan.durationDays);
  const graceEndsAt = addDays(expiresAt, PROPERTY_PLAN_GRACE_PERIOD_DAYS);

  return {
    startsAt,
    expiresAt,
    graceEndsAt,
  };
}
