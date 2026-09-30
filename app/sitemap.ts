import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/app-url";
import { buildLegalDocumentPath, getLegalDocumentSlugs } from "@/lib/legal";

const PUBLIC_PATHS = [
  "",
  "/features",
  "/search-registry",
  "/stolen-items",
  "/catcher-security-credit",
  "/business",
  "/legal",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppBaseUrl();
  const paths = [
    ...PUBLIC_PATHS,
    ...getLegalDocumentSlugs().map(buildLegalDocumentPath),
  ];

  return paths.map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
