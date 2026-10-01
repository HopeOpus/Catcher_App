import { describe, expect, it } from "vitest";
import {
  isTrustedUploadUrl,
  normalizeRegistrationNumber,
  normalizeWebsite,
  slugifyBusinessName,
  validateBusinessProfile,
} from "@/lib/business/validation";

const validProfile = {
  name: "Adewale Logistics Limited",
  businessType: "privateLimited",
  registrationNumber: "rc-1234567",
  taxId: "12345678-0001",
  industry: "Automotive & Logistics",
  email: "Accounts@Adewale.ng",
  phoneNumber: "+234 803 000 0000",
  website: "adewale.ng",
  addressLine: "12 Admiralty Way, Lekki Phase 1",
  city: "Lagos",
  state: "Lagos",
  logoUrl: "",
  cacDocumentUrl: "https://res.cloudinary.com/demo/raw/upload/catcher/business-documents/cac.pdf",
};

describe("normalizeRegistrationNumber", () => {
  it("normalises spacing, case and separators", () => {
    expect(normalizeRegistrationNumber("rc-1234567", "privateLimited")).toBe("RC 1234567");
    expect(normalizeRegistrationNumber(" BN 3456789 ", "businessName")).toBe("BN 3456789");
  });

  it("infers the prefix from the business type when it is missing", () => {
    expect(normalizeRegistrationNumber("1234567", "businessName")).toBe("BN 1234567");
    expect(normalizeRegistrationNumber("98765", "incorporatedTrustees")).toBe("IT 98765");
  });

  it("rejects values that are not CAC numbers", () => {
    expect(normalizeRegistrationNumber("ABC", "privateLimited")).toBeNull();
    expect(normalizeRegistrationNumber("RC12", "privateLimited")).toBeNull();
  });
});

describe("validateBusinessProfile", () => {
  it("accepts and normalises a complete profile", () => {
    const result = validateBusinessProfile(validProfile);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.registrationNumber).toBe("RC 1234567");
      expect(result.data.email).toBe("accounts@adewale.ng");
      expect(result.data.website).toBe("https://adewale.ng");
      expect(result.data.logoUrl).toBeNull();
    }
  });

  it("reports every invalid field at once", () => {
    const result = validateBusinessProfile({
      ...validProfile,
      name: "",
      email: "not-an-email",
      state: "Atlantis",
      industry: "Space mining",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual(["email", "industry", "name", "state"]);
    }
  });

  it("only accepts documents uploaded to Cloudinary", () => {
    const result = validateBusinessProfile({
      ...validProfile,
      cacDocumentUrl: "https://evil.example.com/cac.pdf",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.cacDocumentUrl).toBeDefined();
    }
  });
});

describe("helpers", () => {
  it("builds URL-safe slugs", () => {
    expect(slugifyBusinessName("Adé & Sons Nig. Ltd")).toBe("ade-and-sons-nig-ltd");
    expect(slugifyBusinessName("!!!")).toBe("business");
  });

  it("normalises websites and rejects junk", () => {
    expect(normalizeWebsite("www.company.ng/")).toBe("https://www.company.ng");
    expect(normalizeWebsite("localhost")).toBeNull();
    expect(normalizeWebsite("")).toBeNull();
  });

  it("trusts only https Cloudinary URLs", () => {
    expect(isTrustedUploadUrl("https://res.cloudinary.com/x/image/upload/a.png")).toBe(true);
    expect(isTrustedUploadUrl("http://res.cloudinary.com/x/image/upload/a.png")).toBe(false);
    expect(isTrustedUploadUrl("javascript:alert(1)")).toBe(false);
  });
});
