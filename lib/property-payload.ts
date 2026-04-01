import { normalizeStoredPhotoUrl } from "@/lib/catcher-domain";

function parsePhotoUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (photoUrl): photoUrl is string =>
      typeof photoUrl === "string" && photoUrl.trim().length > 0,
  );
}

function isPersistablePhotoUrl(url: string): boolean {
  if (url.startsWith("/uploads/") || url.startsWith("/api/uploads/")) {
    return true;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseSubmittedPhotoUrls(
  photoUrlsValue: unknown,
  fallbackPhotoUrlValue: unknown,
): { urls: string[]; invalid: boolean } {
  const arrayUrls = parsePhotoUrls(photoUrlsValue);
  const fallbackUrls =
    typeof fallbackPhotoUrlValue === "string" &&
    fallbackPhotoUrlValue.trim().length > 0
      ? [fallbackPhotoUrlValue]
      : [];
  const rawUrls = arrayUrls.length > 0 ? arrayUrls : fallbackUrls;

  if (rawUrls.some((url) => !isPersistablePhotoUrl(url))) {
    return { urls: [], invalid: true };
  }

  return {
    urls: Array.from(new Set(rawUrls.map(normalizeStoredPhotoUrl))),
    invalid: false,
  };
}
