export type LegalCalloutTone = "info" | "warning" | "critical" | "positive";

export type LegalBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "ordered"; items: string[] }
  | { kind: "definitions"; items: { term: string; text: string }[] }
  | {
      kind: "callout";
      tone: LegalCalloutTone;
      title: string;
      text: string;
    }
  | { kind: "table"; caption?: string; columns: string[]; rows: string[][] };

export type LegalSection = {
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  slug: string;
  title: string;
  shortTitle: string;
  /** One-line description used on the legal hub cards and in page metadata. */
  summary: string;
  /** Longer intro shown under the document title. */
  intro: string;
  effectiveDate: string;
  lastUpdated: string;
  version: string;
  sections: LegalSection[];
};
