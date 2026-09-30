import {
  BUSINESS_INDUSTRIES,
  NIGERIAN_STATES,
  isBusinessType,
  type BusinessTypeValue,
} from "@/lib/business/constants";

/** Normalised business profile ready to persist. */
export type BusinessProfileInput = {
  name: string;
  businessType: BusinessTypeValue;
  registrationNumber: string;
  taxId: string | null;
  industry: string;
  email: string;
  phoneNumber: string;
  website: string | null;
  addressLine: string;
  city: string;
  state: string;
  logoUrl: string | null;
  cacDocumentUrl: string | null;
};

export type BusinessProfileField = keyof BusinessProfileInput;

export type BusinessProfileValidation =
  | { ok: true; data: BusinessProfileInput }
  | { ok: false; fieldErrors: Partial<Record<BusinessProfileField, string>> };

const REGISTRATION_PREFIX_BY_TYPE: Record<BusinessTypeValue, string> = {
  businessName: "BN",
  privateLimited: "RC",
  publicLimited: "RC",
  incorporatedTrustees: "IT",
  partnership: "BN",
  other: "RC",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s()-]{6,19}$/;
const TIN_PATTERN = /^[0-9]{8,10}(-[0-9]{4})?$/;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Normalises a CAC number to "PREFIX 1234567". Accepts "RC1234567",
 * "rc-1234567", "1234567" (prefix inferred from the business type) and so on.
 */
export function normalizeRegistrationNumber(
  value: unknown,
  businessType: BusinessTypeValue,
): string | null {
  const compact = text(value).toUpperCase().replace(/[\s.-]/g, "");
  const match = compact.match(/^(RC|BN|IT|LP|LLP)?(\d{3,10})$/);

  if (!match) {
    return null;
  }

  const prefix = match[1] ?? REGISTRATION_PREFIX_BY_TYPE[businessType];
  return `${prefix} ${match[2]}`;
}

export function normalizeWebsite(value: unknown): string | null {
  const raw = text(value);

  if (!raw) {
    return null;
  }

  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.hostname.includes(".") ? url.toString().replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}

/** Only files we uploaded to Cloudinary may be stored as logos or documents. */
export function isTrustedUploadUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export function slugifyBusinessName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return slug || "business";
}

export function validateBusinessProfile(raw: Record<string, unknown>): BusinessProfileValidation {
  const fieldErrors: Partial<Record<BusinessProfileField, string>> = {};

  const name = text(raw.name);
  if (name.length < 2 || name.length > 255) {
    fieldErrors.name = "Enter the business name as registered with CAC.";
  }

  const businessType = raw.businessType;
  if (!isBusinessType(businessType)) {
    fieldErrors.businessType = "Choose how the business is registered.";
  }

  const registrationNumber = isBusinessType(businessType)
    ? normalizeRegistrationNumber(raw.registrationNumber, businessType)
    : null;
  if (!registrationNumber) {
    fieldErrors.registrationNumber = "Enter a valid CAC number, for example RC 1234567 or BN 3456789.";
  }

  const taxIdRaw = text(raw.taxId).replace(/\s/g, "");
  if (taxIdRaw && !TIN_PATTERN.test(taxIdRaw)) {
    fieldErrors.taxId = "A TIN is 8 to 10 digits, optionally followed by -0001.";
  }

  const industry = text(raw.industry);
  if (!(BUSINESS_INDUSTRIES as readonly string[]).includes(industry)) {
    fieldErrors.industry = "Choose the industry closest to what the business does.";
  }

  const email = text(raw.email).toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 255) {
    fieldErrors.email = "Enter a valid business email address.";
  }

  const phoneNumber = text(raw.phoneNumber);
  if (!PHONE_PATTERN.test(phoneNumber)) {
    fieldErrors.phoneNumber = "Enter a valid phone number, for example +234 803 000 0000.";
  }

  const websiteRaw = text(raw.website);
  const website = normalizeWebsite(websiteRaw);
  if (websiteRaw && !website) {
    fieldErrors.website = "Enter a valid website address, or leave it blank.";
  }

  const addressLine = text(raw.addressLine);
  if (addressLine.length < 5 || addressLine.length > 255) {
    fieldErrors.addressLine = "Enter the street address of the head office.";
  }

  const city = text(raw.city);
  if (city.length < 2 || city.length > 100) {
    fieldErrors.city = "Enter the city or town.";
  }

  const state = text(raw.state);
  if (!(NIGERIAN_STATES as readonly string[]).includes(state)) {
    fieldErrors.state = "Choose a state.";
  }

  const logoUrl = text(raw.logoUrl) || null;
  if (logoUrl && !isTrustedUploadUrl(logoUrl)) {
    fieldErrors.logoUrl = "Upload the logo again.";
  }

  const cacDocumentUrl = text(raw.cacDocumentUrl) || null;
  if (cacDocumentUrl && !isTrustedUploadUrl(cacDocumentUrl)) {
    fieldErrors.cacDocumentUrl = "Upload the CAC certificate again.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: {
      name,
      businessType: businessType as BusinessTypeValue,
      registrationNumber: registrationNumber as string,
      taxId: taxIdRaw || null,
      industry,
      email,
      phoneNumber,
      website,
      addressLine,
      city,
      state,
      logoUrl,
      cacDocumentUrl,
    },
  };
}

export function normalizeEmail(value: unknown): string | null {
  const email = text(value).toLowerCase();
  return EMAIL_PATTERN.test(email) && email.length <= 255 ? email : null;
}
