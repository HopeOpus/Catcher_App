import "server-only";
import { unstable_cache } from "next/cache";
import type { CurrencyRateSnapshot } from "@/lib/currency-display";

type FrankfurterRateResponse = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

const getCachedNgnUsdRateSnapshot = unstable_cache(
  async (): Promise<CurrencyRateSnapshot | null> => {
    try {
      const response = await fetch("https://api.frankfurter.dev/v2/rate/NGN/USD", {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Frankfurter rate lookup failed with ${response.status}.`);
      }

      const payload = (await response.json()) as FrankfurterRateResponse;

      if (
        payload.base !== "NGN" ||
        payload.quote !== "USD" ||
        typeof payload.rate !== "number" ||
        Number.isNaN(payload.rate)
      ) {
        throw new Error("Frankfurter returned an unexpected NGN/USD payload.");
      }

      return {
        source: "Frankfurter",
        baseCurrency: "NGN",
        quoteCurrency: "USD",
        rateDate: payload.date,
        fetchedAt: new Date().toISOString(),
        usdPerNgn: payload.rate,
        ngnPerUsd: 1 / payload.rate,
      };
    } catch (error) {
      console.error("Failed to load cached Frankfurter NGN/USD rate:", error);
      return null;
    }
  },
  ["frankfurter-ngn-usd-display-rate"],
  {
    revalidate: ONE_DAY_IN_SECONDS,
    tags: ["currency-display", "currency-display-ngn-usd"],
  },
);

export async function getNgnUsdRateSnapshot() {
  return getCachedNgnUsdRateSnapshot();
}
