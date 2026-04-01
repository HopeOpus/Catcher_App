export const PROFILE_UPDATED_EVENT = "catcher:profile-updated";

export const PROFILE_FIELD_LABELS = {
  phoneNumber: "Phone number",
  nextOfKinEmail: "Next of kin email",
  nextOfKinPhone: "Next of kin phone number",
} as const;

export type ProfileFieldKey = keyof typeof PROFILE_FIELD_LABELS;

export type UserProfileSnapshot = {
  name: string;
  email: string;
  profileImageUrl: string | null;
  phoneNumber: string | null;
  nextOfKinEmail: string | null;
  nextOfKinPhone: string | null;
};

export type UserProfileStatus = {
  profile: UserProfileSnapshot;
  profileComplete: boolean;
  missingFields: string[];
};

type RequiredProfileFields = Pick<
  UserProfileSnapshot,
  "phoneNumber" | "nextOfKinEmail" | "nextOfKinPhone"
>;

export function normalizeProfileValue(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function getMissingProfileFieldKeys(
  profile: RequiredProfileFields,
): ProfileFieldKey[] {
  return (Object.keys(PROFILE_FIELD_LABELS) as ProfileFieldKey[]).filter(
    (field) => !normalizeProfileValue(profile[field]),
  );
}

export function getMissingProfileFieldLabels(
  profile: RequiredProfileFields,
): string[] {
  return getMissingProfileFieldKeys(profile).map(
    (field) => PROFILE_FIELD_LABELS[field],
  );
}

export function isUserProfileComplete(profile: RequiredProfileFields): boolean {
  return getMissingProfileFieldKeys(profile).length === 0;
}

export function buildUserProfileStatus(
  profile: UserProfileSnapshot,
): UserProfileStatus {
  return {
    profile,
    profileComplete: isUserProfileComplete(profile),
    missingFields: getMissingProfileFieldLabels(profile),
  };
}
