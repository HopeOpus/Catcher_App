import { acceptableUsePolicy } from "@/lib/legal/acceptable-use";
import { billingPolicy } from "@/lib/legal/billing";
import { cookiePolicy } from "@/lib/legal/cookies";
import { privacyPolicy } from "@/lib/legal/privacy";
import { stolenReportingPolicy } from "@/lib/legal/stolen-reports";
import { termsOfService } from "@/lib/legal/terms";
import type { LegalDocument } from "@/lib/legal/types";

export { LEGAL_ENTITY, LEGAL_EFFECTIVE_DATE, LEGAL_LAST_UPDATED, LEGAL_VERSION } from "@/lib/legal/entity";
export type { LegalBlock, LegalDocument, LegalSection } from "@/lib/legal/types";

/**
 * Ordered as a reader should meet them: the agreement first, then the data
 * promise, then the conduct rules, then the operational policies.
 */
export const LEGAL_DOCUMENTS: readonly LegalDocument[] = [
  termsOfService,
  privacyPolicy,
  acceptableUsePolicy,
  stolenReportingPolicy,
  billingPolicy,
  cookiePolicy,
] as const;

const LEGAL_DOCUMENT_MAP = new Map(
  LEGAL_DOCUMENTS.map((document) => [document.slug, document]),
);

export function getLegalDocument(slug: string): LegalDocument | null {
  return LEGAL_DOCUMENT_MAP.get(slug) ?? null;
}

export function getLegalDocumentSlugs(): string[] {
  return LEGAL_DOCUMENTS.map((document) => document.slug);
}

export function buildLegalDocumentPath(slug: string): string {
  return `/legal/${slug}`;
}
