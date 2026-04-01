export function getAppBaseUrl(): string {
  const explicitUrl =
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (explicitUrl) {
    return explicitUrl.replace(/\/+$/, "");
  }

  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    const normalized = vercelUrl.replace(/\/+$/, "");
    return normalized.startsWith("http") ? normalized : `https://${normalized}`;
  }

  return "http://localhost:3000";
}
