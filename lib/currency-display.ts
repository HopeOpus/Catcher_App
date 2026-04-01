export const BILLING_DISPLAY_CURRENCIES = ["USD", "NGN"] as const;

export type BillingDisplayCurrency =
  (typeof BILLING_DISPLAY_CURRENCIES)[number];

export type CurrencyRateSnapshot = {
  source: "Frankfurter";
  baseCurrency: "NGN";
  quoteCurrency: "USD";
  rateDate: string;
  fetchedAt: string;
  usdPerNgn: number;
  ngnPerUsd: number;
};

export function convertNgnKoboToUsd(
  amountNgnKobo: number,
  snapshot: CurrencyRateSnapshot,
): number {
  return (amountNgnKobo / 100) * snapshot.usdPerNgn;
}

export function formatUsdAmount(amountUsd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amountUsd >= 100 ? 0 : 2,
    maximumFractionDigits: amountUsd >= 100 ? 0 : 2,
  }).format(amountUsd);
}

export function formatApproxUsdFromNgnKobo(
  amountNgnKobo: number,
  snapshot: CurrencyRateSnapshot,
): string {
  return `~${formatUsdAmount(
    convertNgnKoboToUsd(amountNgnKobo, snapshot),
  )}`;
}

export function formatRateDate(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatNgnPerUsd(snapshot: CurrencyRateSnapshot): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(snapshot.ngnPerUsd);
}
