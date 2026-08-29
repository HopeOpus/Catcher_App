import { SUPPORT_EMAIL } from "@/lib/support";

/**
 * Single source of truth for the legal identity that appears across every
 * Catcher legal document. Update these values once and every document,
 * heading and contact block follows.
 */
export const LEGAL_ENTITY = {
  tradingName: "Catcher",
  legalName: "Catcher Global Technology Limited",
  registrationNumber: "RC 8343759",
  registeredAddress: "Abuja, Nigeria",
  country: "Federal Republic of Nigeria",
  websiteDomain: "catchersecurities.com",
  websiteUrl: "https://www.catchersecurities.com",
  supportEmail: SUPPORT_EMAIL,
  privacyEmail: SUPPORT_EMAIL,
  legalEmail: SUPPORT_EMAIL,
} as const;

export const LEGAL_EFFECTIVE_DATE = "28 August 2026";
export const LEGAL_LAST_UPDATED = "28 August 2026";
export const LEGAL_VERSION = "1.0";
