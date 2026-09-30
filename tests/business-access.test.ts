import { describe, expect, it, vi } from "vitest";

// account-scope imports next/headers; only its pure helpers are tested here.
vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));

import { canInScope, ownershipWhere, scopeBusinessId, type AccountScope } from "@/lib/account-scope";
import { canAssignRole, canManageMemberRole, roleCan } from "@/lib/business/permissions";
import {
  getPropertyPlanDefinition,
  getPropertyPlanDefinitions,
  isPropertyPlanAvailable,
} from "@/lib/property-plans";

const personal: AccountScope = { kind: "personal", userId: "user_1" };

function businessScope(role: "owner" | "admin" | "member" | "viewer"): AccountScope {
  return {
    kind: "business",
    userId: "user_1",
    businessId: "biz_1",
    role,
    business: {
      id: "biz_1",
      name: "Acme Logistics",
      slug: "acme-logistics",
      logoUrl: null,
      verificationStatus: "pending",
    },
  };
}

describe("ownershipWhere", () => {
  it("keeps personal queries away from business records", () => {
    expect(ownershipWhere(personal)).toEqual({ userId: "user_1", businessId: null });
  });

  it("scopes business queries to the business, not the member", () => {
    expect(ownershipWhere(businessScope("member"))).toEqual({ businessId: "biz_1" });
    expect(scopeBusinessId(businessScope("viewer"))).toBe("biz_1");
    expect(scopeBusinessId(personal)).toBeNull();
  });
});

describe("role permissions", () => {
  it("lets personal accounts do everything", () => {
    expect(canInScope(personal, "deleteProperty")).toBe(true);
    expect(canInScope(personal, "manageMembers")).toBe(true);
  });

  it("keeps viewers read-only", () => {
    const viewer = businessScope("viewer");
    expect(canInScope(viewer, "view")).toBe(true);
    expect(canInScope(viewer, "registerProperty")).toBe(false);
    expect(canInScope(viewer, "purchase")).toBe(false);
    expect(canInScope(viewer, "reportStolen")).toBe(false);
  });

  it("lets members register and report but not delete or manage the team", () => {
    const member = businessScope("member");
    expect(canInScope(member, "registerProperty")).toBe(true);
    expect(canInScope(member, "reportStolen")).toBe(true);
    expect(canInScope(member, "deleteProperty")).toBe(false);
    expect(canInScope(member, "manageMembers")).toBe(false);
  });

  it("reserves ownership transfer for owners", () => {
    expect(roleCan("admin", "transferOwnership")).toBe(false);
    expect(roleCan("owner", "transferOwnership")).toBe(true);
  });

  it("lets admins manage only roles below their own", () => {
    expect(canManageMemberRole("admin", "member")).toBe(true);
    expect(canManageMemberRole("admin", "viewer")).toBe(true);
    expect(canManageMemberRole("admin", "admin")).toBe(false);
    expect(canManageMemberRole("admin", "owner")).toBe(false);
    expect(canManageMemberRole("member", "viewer")).toBe(false);
  });

  it("lets owners manage everyone except other owners", () => {
    expect(canManageMemberRole("owner", "admin")).toBe(true);
    expect(canManageMemberRole("owner", "owner")).toBe(false);
  });

  it("never grants owner through invites or role changes", () => {
    expect(canAssignRole("owner", "owner")).toBe(false);
    expect(canAssignRole("owner", "admin")).toBe(true);
    expect(canAssignRole("admin", "admin")).toBe(false);
    expect(canAssignRole("admin", "member")).toBe(true);
    expect(canAssignRole("viewer", "viewer")).toBe(false);
  });
});

describe("business pricing", () => {
  it("prices business plans slightly above the personal plans", () => {
    expect(getPropertyPlanDefinition("monthly", "business").priceNgnKobo).toBe(100_000);
    expect(getPropertyPlanDefinition("yearly", "business").priceNgnKobo).toBe(600_000);
    expect(getPropertyPlanDefinition("monthly", "business").priceNgnKobo).toBeGreaterThan(
      getPropertyPlanDefinition("monthly").priceNgnKobo,
    );
  });

  it("offers businesses no free plan", () => {
    expect(isPropertyPlanAvailable("free", "business")).toBe(false);
    expect(isPropertyPlanAvailable("free", "personal")).toBe(true);
    expect(getPropertyPlanDefinitions("business").map((plan) => plan.code)).toEqual([
      "monthly",
      "yearly",
    ]);
    expect(() => getPropertyPlanDefinition("free", "business")).toThrow(/free plan/);
  });
});
