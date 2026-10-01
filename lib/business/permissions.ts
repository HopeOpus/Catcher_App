import type { BusinessMemberRoleValue } from "@/lib/business/constants";

/**
 * What a member can do inside a business account. Personal accounts are
 * allowed everything; see canInScope in lib/account-scope.ts.
 */
export type BusinessAction =
  | "view"
  | "registerProperty"
  | "editProperty"
  | "deleteProperty"
  | "reportStolen"
  | "purchase"
  | "manageMembers"
  | "editBusiness"
  | "transferOwnership";

const ROLE_ACTIONS: Record<BusinessMemberRoleValue, ReadonlySet<BusinessAction>> = {
  viewer: new Set(["view"]),
  member: new Set(["view", "registerProperty", "editProperty", "reportStolen", "purchase"]),
  admin: new Set([
    "view",
    "registerProperty",
    "editProperty",
    "deleteProperty",
    "reportStolen",
    "purchase",
    "manageMembers",
    "editBusiness",
  ]),
  owner: new Set([
    "view",
    "registerProperty",
    "editProperty",
    "deleteProperty",
    "reportStolen",
    "purchase",
    "manageMembers",
    "editBusiness",
    "transferOwnership",
  ]),
};

const ROLE_RANK: Record<BusinessMemberRoleValue, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

export function roleCan(role: BusinessMemberRoleValue, action: BusinessAction): boolean {
  return ROLE_ACTIONS[role].has(action);
}

/**
 * Whether `actor` may change or remove a member holding `target`. Admins can
 * manage members and viewers but not other admins or owners; owners can manage
 * anyone except themselves (ownership moves through a transfer instead).
 */
export function canManageMemberRole(
  actor: BusinessMemberRoleValue,
  target: BusinessMemberRoleValue,
): boolean {
  if (!roleCan(actor, "manageMembers")) {
    return false;
  }

  if (actor === "owner") {
    return target !== "owner";
  }

  return ROLE_RANK[target] < ROLE_RANK[actor];
}

/** Whether `actor` may grant `role` (through an invite or a role change). */
export function canAssignRole(
  actor: BusinessMemberRoleValue,
  role: BusinessMemberRoleValue,
): boolean {
  if (role === "owner" || !roleCan(actor, "manageMembers")) {
    return false;
  }

  return actor === "owner" || ROLE_RANK[role] < ROLE_RANK[actor];
}
