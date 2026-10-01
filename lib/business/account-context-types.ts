import type {
  BusinessMemberRoleValue,
  BusinessVerificationStatusValue,
} from "@/lib/business/constants";

/** Response shape of GET /api/account-context. */
export type AccountContextResponse = {
  personal: { name: string; email: string };
  active:
    | { kind: "personal" }
    | {
        kind: "business";
        businessId: string;
        name: string;
        logoUrl: string | null;
        role: BusinessMemberRoleValue;
        verificationStatus: BusinessVerificationStatusValue;
        canManageMembers: boolean;
      };
  businesses: Array<{
    businessId: string;
    name: string;
    logoUrl: string | null;
    role: BusinessMemberRoleValue;
    verificationStatus: BusinessVerificationStatusValue;
  }>;
};

/** Fired on window after the active account changes, so shells can refetch. */
export const ACCOUNT_CHANGED_EVENT = "catcher:account-changed";
