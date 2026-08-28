import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_ENTITY,
  LEGAL_LAST_UPDATED,
  LEGAL_VERSION,
} from "@/lib/legal/entity";
import { LEGAL_FACTS } from "@/lib/legal/facts";
import type { LegalDocument } from "@/lib/legal/types";

export const stolenReportingPolicy: LegalDocument = {
  slug: "stolen-reports",
  title: "Stolen Property Reporting & Verification Policy",
  shortTitle: "Reporting & Verification",
  summary:
    "How stolen reports are filed, published, reviewed and disputed — and exactly what a Catcher verification page does and does not prove.",
  intro:
    "This policy governs the two public-facing parts of Catcher: the stolen items database, where reported items are published so buyers can check them, and the verification pages that let an owner prove an item is registered. It explains what we publish, what we expect from you, and how a listing can be challenged.",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  lastUpdated: LEGAL_LAST_UPDATED,
  version: LEGAL_VERSION,
  sections: [
    {
      id: "purpose",
      heading: "1. Purpose",
      blocks: [
        {
          kind: "paragraph",
          text: "Second-hand goods change hands constantly, and a buyer usually has no way to tell whether the item in front of them was stolen last week. Catcher exists to close that gap: owners document what they own, report it if it is taken, and buyers can check a serial number before they pay.",
        },
        {
          kind: "paragraph",
          text: "This only works if reports are honest and listings are current. This policy is how we keep them that way.",
        },
      ],
    },
    {
      id: "who-can-report",
      heading: "2. Who can file a report",
      blocks: [
        {
          kind: "paragraph",
          text: "You can file a stolen property report if you hold a Catcher account, the item is already registered to that account, and the item has been stolen from you or from someone who authorised you to act for them.",
        },
        {
          kind: "paragraph",
          text: "A report is filed against an existing property record, so the item details, serial number and photographs already on file carry over. You add the date, the location, a description of the circumstances and any supporting evidence images.",
        },
        {
          kind: "paragraph",
          text: "Your profile must be complete — including a working phone number and next-of-kin contact — before you can file. We need to be able to reach you about the report.",
        },
      ],
    },
    {
      id: "declaration",
      heading: "3. What you declare when you file",
      blocks: [
        {
          kind: "paragraph",
          text: "By submitting a stolen property report you declare that:",
        },
        {
          kind: "ordered",
          items: [
            "the item described was stolen, and was not sold, gifted, lent, pledged, repossessed or merely mislaid;",
            "you are the owner of the item or are authorised to report on the owner's behalf;",
            "every detail in the report is true and accurate to the best of your knowledge;",
            "the evidence you upload is genuine and relates to this item and this incident;",
            "you understand the report will be published publicly with the item name, serial number, date, location, description and status; and",
            "you will update or withdraw the report promptly if the item is recovered or the position changes.",
          ],
        },
      ],
    },
    {
      id: "police",
      heading: "4. Report to the police as well",
      blocks: [
        {
          kind: "callout",
          tone: "critical",
          title: "Catcher does not notify the authorities for you",
          text: "Filing on Catcher creates a database entry. It does not open a criminal case, does not alert the Nigeria Police Force or any other agency, and does not discharge any legal reporting duty you may have — including duties owed to an insurer. Report the theft to the police separately, as soon as you can, and keep the official report or extract.",
        },
        {
          kind: "paragraph",
          text: "We strongly recommend attaching your police report reference to your Catcher report. It makes the listing far more credible to a buyer, and it makes any subsequent dispute much easier to resolve.",
        },
      ],
    },
    {
      id: "what-we-publish",
      heading: "5. What we publish, and what we hold back",
      blocks: [
        {
          kind: "table",
          columns: ["Field", "Published in the stolen items database"],
          rows: [
            ["Item name", "Yes"],
            ["Serial number or identifier", "Yes"],
            ["Date reported", "Yes"],
            ["Location of the incident", "Yes"],
            ["Description of the circumstances", "Yes"],
            ["Report status", "Yes"],
            ["Your name, email, phone number", "No"],
            ["Your National Identification Number", "No"],
            ["Your next-of-kin details", "No"],
            ["Evidence images you upload", "No — held for review only"],
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          title: "Location and description are public",
          text: "Write them for a stranger to read. Do not enter your home address, your workplace, an account number, or a place where you keep other valuables. Never name or accuse an individual — describe the item and the circumstances instead.",
        },
        {
          kind: "paragraph",
          text: `Public lookups are rate limited to approximately ${LEGAL_FACTS.publicLookupRateLimitLabel} to prevent bulk harvesting of the database.`,
        },
      ],
    },
    {
      id: "statuses",
      heading: "6. Report statuses",
      blocks: [
        {
          kind: "paragraph",
          text: "Every report carries a status that is shown publicly.",
        },
        {
          kind: "definitions",
          items: [
            {
              term: "Reported",
              text: "The report has been filed by the owner and published. It has not yet been reviewed by our team, and the claim in it is unverified.",
            },
            {
              term: "Under Investigation",
              text: "The report is being reviewed — by our team, by an owner responding to a dispute, or in connection with a law enforcement enquiry. The listing stays public while this happens.",
            },
            {
              term: "Resolved",
              text: "The matter is closed. The item was recovered, the report was withdrawn, or the report was found not to stand. The listing is updated accordingly.",
            },
          ],
        },
        {
          kind: "paragraph",
          text: "A status is a description of where the report stands on Catcher. It is not a finding of fact, a legal determination, or a statement about anyone's guilt.",
        },
        {
          kind: "paragraph",
          text: "A listing is removed from public view if the underlying property is archived — which happens when coverage lapses beyond its " +
            `${LEGAL_FACTS.gracePeriodDays}-day grace period — or if the report is withdrawn or removed by us.`,
        },
      ],
    },
    {
      id: "verification-pages",
      heading: "7. Verification pages and QR codes",
      blocks: [
        {
          kind: "paragraph",
          text: "Every property with live coverage gets a public verification page at a unique address, together with a QR code that opens it. Owners use it to show that an item is documented — when selling, when passing through a checkpoint, or when an employer asks about equipment.",
        },
        {
          kind: "paragraph",
          text: "The page shows the item name, category, serial number, registration date, item status, plan name and status, coverage expiry, description, cover photograph and a verification ID. It deliberately shows nothing about the owner.",
        },
        {
          kind: "callout",
          tone: "warning",
          title: "What a green verification page actually means",
          text: "It means: a Catcher account registered an item with these details, and coverage on it is currently live. It does not mean: the person showing you the page owns the item, that the item in your hand is the item on the screen, or that the item is not the subject of a dispute. Always compare the physical serial number against the page, and search the stolen items database as well.",
        },
        {
          kind: "paragraph",
          text: "We may deactivate a verification page where the underlying record is disputed, archived, or found to breach our Acceptable Use Policy.",
        },
      ],
    },
    {
      id: "buyer-guidance",
      heading: "8. Guidance for buyers",
      blocks: [
        {
          kind: "paragraph",
          text: "If you are about to buy something second-hand, we suggest you:",
        },
        {
          kind: "ordered",
          items: [
            "read the serial number off the item itself, not from a photograph or a screen;",
            "search that serial number in the public stolen items database;",
            "ask the seller for a Catcher verification page or QR code, and check the serial number matches;",
            "check that the coverage on the verification page is live and not expired;",
            "be cautious if the seller cannot explain how they acquired the item, or refuses to let you inspect it; and",
            "keep a record of the transaction — a receipt, the seller's details and the date.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          title: "A clean search is not a guarantee",
          text: "An item can be absent from the database because it was never registered, because its owner does not use Catcher, or because they have not filed the report yet. Absence of a listing is not evidence that an item is clean. Use Catcher as one check among several, not as the only one.",
        },
        {
          kind: "paragraph",
          text: "If you believe an item offered to you is stolen, do not buy it. Report the matter to the police, and tell us at " +
            LEGAL_ENTITY.supportEmail +
            " so we can update the record.",
        },
      ],
    },
    {
      id: "disputes",
      heading: "9. Disputing a listing",
      blocks: [
        {
          kind: "paragraph",
          text: "If an item is listed as stolen and you believe the listing is wrong — for example you bought the item lawfully, or the report was filed out of a private dispute — you can challenge it.",
        },
        {
          kind: "paragraph",
          text: `Send a dispute to ${LEGAL_ENTITY.supportEmail} with “Stolen listing dispute” in the subject line, including:`,
        },
        {
          kind: "list",
          items: [
            "the serial number and item name as they appear in the listing;",
            "your full name and contact details;",
            "an explanation of why you say the listing is wrong;",
            "any evidence you can provide — a receipt, invoice, transfer agreement, chat history or police report; and",
            "confirmation that the information you have given is true.",
          ],
        },
        {
          kind: "paragraph",
          text: "We will acknowledge your dispute within five business days. We will normally move the report to Under Investigation, notify the reporting owner, and give them a reasonable period to respond with their own evidence.",
        },
        {
          kind: "callout",
          tone: "info",
          title: "The limits of what we can decide",
          text: "Catcher is not a court and cannot determine who legally owns an item. What we can do is assess whether a report meets our policy, whether it appears to have been made in good faith, and whether it should stand, be corrected, be marked resolved, or be removed. A genuine ownership dispute between two people belongs before the police or a court.",
        },
        {
          kind: "paragraph",
          text: "Where a report is found to be false or unsupported, we remove the listing, record the outcome, and take action against the reporting account under our Acceptable Use Policy. Where it stands, we tell you and explain why.",
        },
      ],
    },
    {
      id: "false-reports",
      heading: "10. False and malicious reports",
      blocks: [
        {
          kind: "paragraph",
          text: "Publishing a serial number as stolen has real consequences for whoever holds that item. A false report can block a lawful sale, cause someone to be accused of handling stolen goods, and cause serious reputational and financial harm.",
        },
        {
          kind: "paragraph",
          text: "If we find that a report was knowingly false or malicious, we will:",
        },
        {
          kind: "list",
          items: [
            "remove the listing immediately;",
            "permanently close the account that filed it, without refund of any coverage purchased;",
            "retain the record, the evidence and the audit trail; and",
            "where lawfully required or permitted, disclose the account details to law enforcement or to the affected party.",
          ],
        },
        {
          kind: "paragraph",
          text: "Filing a knowingly false report may also expose you to civil liability for defamation and to criminal liability under Nigerian law. Catcher accepts no liability for the consequences of a report you file.",
        },
      ],
    },
    {
      id: "law-enforcement",
      heading: "11. Law enforcement requests",
      blocks: [
        {
          kind: "paragraph",
          text: `Requests from the police, a regulator or a court should be sent to ${LEGAL_ENTITY.legalEmail} on official letterhead, identifying the requesting officer or authority, the specific records sought, and the legal basis for the request.`,
        },
        {
          kind: "paragraph",
          text: "We review every request. We disclose only what we are lawfully required or permitted to disclose, and only what is proportionate to the request. Where we are legally able to, we will tell the affected user before disclosing their data.",
        },
        {
          kind: "paragraph",
          text: "We may preserve records relevant to an active investigation beyond our normal retention period.",
        },
      ],
    },
    {
      id: "limitations",
      heading: "12. Limitations of this service",
      blocks: [
        {
          kind: "paragraph",
          text: "So that there is no misunderstanding:",
        },
        {
          kind: "list",
          items: [
            "Catcher does not verify reports before publishing them;",
            "Catcher does not investigate thefts, recover property, or act as an agent for any user;",
            "a listing is one user's unverified claim, not a finding of fact;",
            "the database covers only items registered by Catcher users and is not a national or complete record of stolen goods;",
            "Catcher gives no guarantee that reporting an item will lead to its recovery; and",
            "Catcher is not insurance and pays no compensation for lost, stolen or damaged property.",
          ],
        },
        {
          kind: "paragraph",
          text: "These limitations are reflected in the disclaimers and liability provisions of our Terms of Service.",
        },
      ],
    },
  ],
};
