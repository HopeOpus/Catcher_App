import { SUPPORT_EMAIL } from "@/lib/support";

/**
 * Single source of truth for the legal identity that appears across every
 * Catcher legal document. Update these values once and every document,
 * heading and contact block follows.
 *
 * TODO(legal): replace the placeholder registration and address values with
 * the details on the Catcher certificate of incorporation before publishing.
 */
export const LEGAL_ENTITY = {
  tradingName: "Catcher",
  legalName: "Catcher Technologies Limited",
  registrationNumber: "RC — (to be confirmed)",
  registeredAddress: "Lagos, Nigeria (full registered address to be confirmed)",
  country: "Federal Republic of Nigeria",
  websiteDomain: "catcher.com.ng",
  websiteUrl: "https://www.catcher.com.ng",
  supportEmail: SUPPORT_EMAIL,
  privacyEmail: SUPPORT_EMAIL,
  legalEmail: SUPPORT_EMAIL,
} as const;

export const LEGAL_EFFECTIVE_DATE = "28 August 2026";
export const LEGAL_LAST_UPDATED = "28 August 2026";
export const LEGAL_VERSION = "1.0";
