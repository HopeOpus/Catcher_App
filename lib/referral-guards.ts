import type { AuthenticatedAppUser } from "@/lib/authenticated-user";

type ReferralAttachmentCurrentUser = {
  id: string;
  email: string;
  phoneNumber: string | null;
  createdAt: Date;
};

type ReferralAttachmentReferrerUser = {
  id: string;
  email: string;
  phoneNumber: string | null;
};

type ReferralAttachmentDeviceMatch = {
  referredUserId: string;
  referrerUserId: string;
};

type EvaluateReferralAttachmentInput = {
  authenticatedUser: AuthenticatedAppUser;
  currentUser: ReferralAttachmentCurrentUser;
  referrerUser: ReferralAttachmentReferrerUser;
  deviceInstallId: string | null;
  existingDeviceMatch: ReferralAttachmentDeviceMatch | null;
  hasExistingCheckoutActivity: boolean;
};

type ReferralGuardDecision =
  | {
      outcome: "blocked";
      fraudReviewStatus: "blocked";
      reason: string;
    }
  | {
      outcome: "allow";
      fraudReviewStatus: "clear" | "flagged";
      reviewReason: string | null;
    };

export function normalizePhone(value: string | null | undefined) {
  return value ? value.replace(/\D/g, "") : null;
}

export function normalizeDeviceInstallId(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= 255 ? normalized : null;
}

export function evaluateReferralAttachment(
  input: EvaluateReferralAttachmentInput,
): ReferralGuardDecision {
  const currentEmail = input.authenticatedUser.email.trim().toLowerCase();
  const candidateEmails = input.authenticatedUser.candidateEmails.map((value) =>
    value.trim().toLowerCase(),
  );
  const referrerEmail = input.referrerUser.email.trim().toLowerCase();

  if (input.referrerUser.id === input.authenticatedUser.userId) {
    return {
      outcome: "blocked",
      fraudReviewStatus: "blocked",
      reason: "You cannot use your own referral code.",
    };
  }

  if (candidateEmails.includes(referrerEmail) || currentEmail === referrerEmail) {
    return {
      outcome: "blocked",
      fraudReviewStatus: "blocked",
      reason: "You cannot use a referral code from the same email account.",
    };
  }

  const currentPhone = normalizePhone(input.currentUser.phoneNumber);
  const referrerPhone = normalizePhone(input.referrerUser.phoneNumber);
  if (currentPhone && referrerPhone && currentPhone === referrerPhone) {
    return {
      outcome: "blocked",
      fraudReviewStatus: "blocked",
      reason: "You cannot use a referral code from the same phone number.",
    };
  }

  if (input.hasExistingCheckoutActivity) {
    return {
      outcome: "blocked",
      fraudReviewStatus: "blocked",
      reason:
        "Referral codes must be attached before your first registration checkout.",
    };
  }

  if (
    input.deviceInstallId &&
    input.existingDeviceMatch &&
    input.existingDeviceMatch.referredUserId !== input.authenticatedUser.userId
  ) {
    return {
      outcome: "blocked",
      fraudReviewStatus: "blocked",
      reason:
        "This device has already been used for another referral signup.",
    };
  }

  if (!input.authenticatedUser.emailVerified) {
    return {
      outcome: "allow",
      fraudReviewStatus: "flagged",
      reviewReason: "email_not_verified",
    };
  }

  const accountAgeMs = Date.now() - input.currentUser.createdAt.getTime();
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
  if (accountAgeMs > twoWeeksMs) {
    return {
      outcome: "allow",
      fraudReviewStatus: "flagged",
      reviewReason: "late_referral_attach",
    };
  }

  return {
    outcome: "allow",
    fraudReviewStatus: "clear",
    reviewReason: null,
  };
}
