/**
 * Business account constants. Client-safe: no Prisma or server imports, so
 * forms and badges can use these directly.
 */

export const BUSINESS_MEMBER_ROLES = ["owner", "admin", "member", "viewer"] as const;
export type BusinessMemberRoleValue = (typeof BUSINESS_MEMBER_ROLES)[number];

export const BUSINESS_ROLE_LABELS: Record<BusinessMemberRoleValue, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

export const BUSINESS_ROLE_DESCRIPTIONS: Record<BusinessMemberRoleValue, string> = {
  owner: "Full control, including billing, team and ownership transfer.",
  admin: "Manage properties, team members and business details.",
  member: "Register, edit and renew properties and file stolen reports.",
  viewer: "Read-only access to properties, reports and billing history.",
};

/** Roles an owner or admin can hand out through an invite. */
export const INVITABLE_BUSINESS_ROLES = ["admin", "member", "viewer"] as const;
export type InvitableBusinessRole = (typeof INVITABLE_BUSINESS_ROLES)[number];

export const BUSINESS_TYPES = [
  "businessName",
  "privateLimited",
  "publicLimited",
  "incorporatedTrustees",
  "partnership",
  "other",
] as const;
export type BusinessTypeValue = (typeof BUSINESS_TYPES)[number];

export const BUSINESS_TYPE_LABELS: Record<BusinessTypeValue, string> = {
  businessName: "Business Name (BN)",
  privateLimited: "Private Limited Company (Ltd)",
  publicLimited: "Public Limited Company (Plc)",
  incorporatedTrustees: "Incorporated Trustees (IT)",
  partnership: "Partnership",
  other: "Other",
};

export const BUSINESS_VERIFICATION_STATUSES = [
  "unsubmitted",
  "pending",
  "verified",
  "rejected",
] as const;
export type BusinessVerificationStatusValue =
  (typeof BUSINESS_VERIFICATION_STATUSES)[number];

export const BUSINESS_VERIFICATION_LABELS: Record<BusinessVerificationStatusValue, string> = {
  unsubmitted: "Documents needed",
  pending: "Under review",
  verified: "Verified",
  rejected: "Rejected",
};

export const BUSINESS_INDUSTRIES = [
  "Automotive & Logistics",
  "Banking & Finance",
  "Construction & Real Estate",
  "Education",
  "Electronics & Technology",
  "Energy & Oil and Gas",
  "Government & Public Sector",
  "Healthcare",
  "Hospitality & Events",
  "Insurance",
  "Jewellery & Luxury Goods",
  "Manufacturing",
  "Media & Entertainment",
  "Non-profit & Religious",
  "Professional Services",
  "Retail & E-commerce",
  "Security Services",
  "Telecommunications",
  "Other",
] as const;

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "Federal Capital Territory", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun",
  "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe",
  "Zamfara",
] as const;

/** Cookie holding the active dashboard account: "personal" or a business id. */
export const ACTIVE_ACCOUNT_COOKIE = "catcher_account";
export const PERSONAL_ACCOUNT_KEY = "personal";

export const BUSINESS_INVITE_TTL_DAYS = 7;

export function isBusinessMemberRole(value: unknown): value is BusinessMemberRoleValue {
  return typeof value === "string" && (BUSINESS_MEMBER_ROLES as readonly string[]).includes(value);
}

export function isInvitableBusinessRole(value: unknown): value is InvitableBusinessRole {
  return typeof value === "string" && (INVITABLE_BUSINESS_ROLES as readonly string[]).includes(value);
}

export function isBusinessType(value: unknown): value is BusinessTypeValue {
  return typeof value === "string" && (BUSINESS_TYPES as readonly string[]).includes(value);
}
