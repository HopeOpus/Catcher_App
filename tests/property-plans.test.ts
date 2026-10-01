import { describe, expect, it } from "vitest";
import {
  PROPERTY_PLAN_GRACE_PERIOD_DAYS,
  buildPropertyCoverageWindow,
  formatNgnFromKobo,
  getPropertyPlanDefinition,
} from "@/lib/property-plans";
import { convertNgnKoboToWalletCredits } from "@/lib/wallet";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("property plans", () => {
  it("prices personal plans at ₦800 monthly and ₦5,000 yearly", () => {
    expect(getPropertyPlanDefinition("monthly").priceNgnKobo).toBe(80_000);
    expect(getPropertyPlanDefinition("yearly").priceNgnKobo).toBe(500_000);
    expect(getPropertyPlanDefinition("free").priceNgnKobo).toBe(0);
  });

  it("formats kobo as whole naira", () => {
    expect(formatNgnFromKobo(500_000)).toMatch(/5,000/);
  });

  it("gives free coverage no expiry", () => {
    const window = buildPropertyCoverageWindow({
      planCode: "free",
      settledAt: new Date("2026-01-01T00:00:00Z"),
    });

    expect(window.expiresAt).toBeNull();
    expect(window.graceEndsAt).toBeNull();
  });

  it("starts paid coverage at settlement and adds the grace period", () => {
    const settledAt = new Date("2026-01-01T00:00:00Z");
    const window = buildPropertyCoverageWindow({ planCode: "monthly", settledAt });

    expect(window.startsAt).toEqual(settledAt);
    expect(window.expiresAt!.getTime() - settledAt.getTime()).toBe(30 * DAY_MS);
    expect(window.graceEndsAt!.getTime() - window.expiresAt!.getTime()).toBe(
      PROPERTY_PLAN_GRACE_PERIOD_DAYS * DAY_MS,
    );
  });

  it("extends a renewal from the existing expiry when it is still in the future", () => {
    const settledAt = new Date("2026-01-01T00:00:00Z");
    const renewFromExpiresAt = new Date("2026-01-20T00:00:00Z");
    const window = buildPropertyCoverageWindow({
      planCode: "yearly",
      settledAt,
      renewFromExpiresAt,
    });

    expect(window.startsAt).toEqual(renewFromExpiresAt);
    expect(window.expiresAt!.getTime() - renewFromExpiresAt.getTime()).toBe(365 * DAY_MS);
  });

  it("ignores a renewal anchor that has already lapsed", () => {
    const settledAt = new Date("2026-02-01T00:00:00Z");
    const window = buildPropertyCoverageWindow({
      planCode: "monthly",
      settledAt,
      renewFromExpiresAt: new Date("2026-01-01T00:00:00Z"),
    });

    expect(window.startsAt).toEqual(settledAt);
  });
});

describe("wallet credit conversion", () => {
  it("converts kobo to whole credits, rounding up", () => {
    expect(convertNgnKoboToWalletCredits(80_000)).toBe(800);
    expect(convertNgnKoboToWalletCredits(150)).toBe(2);
    expect(convertNgnKoboToWalletCredits(0)).toBe(0);
    expect(convertNgnKoboToWalletCredits(Number.NaN)).toBe(0);
  });
});
