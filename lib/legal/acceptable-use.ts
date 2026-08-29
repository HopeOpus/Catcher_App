import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_ENTITY,
  LEGAL_LAST_UPDATED,
  LEGAL_VERSION,
} from "@/lib/legal/entity";
import { LEGAL_FACTS } from "@/lib/legal/facts";
import type { LegalDocument } from "@/lib/legal/types";

export const acceptableUsePolicy: LegalDocument = {
  slug: "acceptable-use",
  title: "Acceptable Use Policy",
  shortTitle: "Acceptable Use",
  summary:
    "The rules every Catcher account must follow — record accuracy, honest reporting, respect for owner data, and technical limits.",
  intro:
    "A property registry is only as trustworthy as the people using it. This Acceptable Use Policy sets out what you may and may not do on Catcher. It forms part of our Terms of Service, and breaking it can cost you your account.",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  lastUpdated: LEGAL_LAST_UPDATED,
  version: LEGAL_VERSION,
  sections: [
    {
      id: "scope",
      heading: "1. Who this applies to",
      blocks: [
        {
          kind: "paragraph",
          text: "This policy applies to everyone who uses Catcher: account holders, administrators, and visitors who use the public stolen items database or open a public verification page without signing in.",
        },
        {
          kind: "paragraph",
          text: "It applies to every surface of the Service — the website, the dashboard, the mobile application and our APIs.",
        },
      ],
    },
    {
      id: "core-principles",
      heading: "2. The three rules that matter most",
      blocks: [
        {
          kind: "ordered",
          items: [
            "Only register what is yours. Register property you own, or that you are expressly authorised to register on the owner's behalf.",
            "Only report what is true. File a stolen report because something was actually stolen — never to punish, pressure or embarrass someone.",
            "Only use owner data to reach an owner. Contact details you obtain through Catcher exist to reunite people with their property, and for nothing else.",
          ],
        },
        {
          kind: "paragraph",
          text: "Almost every rule below follows from one of these three.",
        },
      ],
    },
    {
      id: "registration-integrity",
      heading: "3. Integrity of property records",
      blocks: [
        {
          kind: "paragraph",
          text: "You must not:",
        },
        {
          kind: "list",
          items: [
            "register an item you do not own and are not authorised to register;",
            "register an item you know or suspect to be stolen, in order to make it look legitimate;",
            "enter a serial number, identifier or registration date you know to be false;",
            "upload photographs of an item you do not have, including images taken from listings, catalogues or other people's records;",
            "create duplicate records for the same item in order to obtain more than the permitted free registration;",
            "create multiple accounts in order to bypass the " +
              `${LEGAL_FACTS.freePlanLifetimeLimit}-property lifetime limit on the free plan; or`,
            "edit a record after the fact to misrepresent when or by whom an item was registered.",
          ],
        },
        {
          kind: "callout",
          tone: "critical",
          title: "Laundering stolen goods",
          text: "Using a Catcher registration or verification page to make stolen property appear legitimate is the most serious misuse of this Service. We will close the account permanently, preserve the record, and cooperate fully with law enforcement.",
        },
      ],
    },
    {
      id: "honest-reporting",
      heading: "4. Honest stolen reporting",
      blocks: [
        {
          kind: "paragraph",
          text: "A stolen report is published to a database that strangers rely on when deciding whether to buy something. Publishing a serial number as stolen can stop a lawful sale and can seriously damage the person holding the item.",
        },
        {
          kind: "paragraph",
          text: "You must not:",
        },
        {
          kind: "list",
          items: [
            "file a report about an item that was not stolen;",
            "file a report about an item you sold, gifted, pledged, lost, or surrendered;",
            "file a report in the course of a commercial, contractual or family dispute in order to gain leverage;",
            "leave a report open after the item has been recovered or the matter resolved; or",
            "include a person's name, photograph or accusation of a crime in the description field. Describe the item and the incident, not the individual you suspect.",
          ],
        },
        {
          kind: "paragraph",
          text: "You must promptly update or withdraw a report once the item is recovered or the report is no longer accurate. Our Stolen Property Reporting & Verification Policy explains how.",
        },
      ],
    },
    {
      id: "owner-data",
      heading: "5. Owner and identity data",
      blocks: [
        {
          kind: "paragraph",
          text: "Anyone can search the public registry and see which named registrant holds a given item. Signing in additionally reveals that registrant's email address and phone number, and authenticated application lookups may return a National Identification Number and next-of-kin contact details. This capability exists for one reason: so that a finder, buyer or investigator can reach an owner about a specific item.",
        },
        {
          kind: "paragraph",
          text: "You must not:",
        },
        {
          kind: "list",
          items: [
            "use owner or next-of-kin contact details for marketing, sales outreach, recruitment or any unsolicited messaging;",
            "store, compile, resell, publish or transfer owner details to anyone else;",
            "use a National Identification Number obtained through Catcher for identity verification, credit checking, impersonation, or any purpose other than the specific matter you are contacting the owner about;",
            "harass, threaten, defraud or extort an owner or their next of kin; or",
            "perform lookups in bulk, or lookups unconnected to a genuine enquiry about a specific item.",
          ],
        },
        {
          kind: "callout",
          tone: "critical",
          title: "Identity data is not yours to keep",
          text: "Misusing a National Identification Number obtained through Catcher is a breach of this policy, a breach of the Nigeria Data Protection Act 2023, and may be a criminal offence. Lookups are logged. We will act on misuse.",
        },
      ],
    },
    {
      id: "content-standards",
      heading: "6. Content standards",
      blocks: [
        {
          kind: "paragraph",
          text: `Uploads must be ${LEGAL_FACTS.allowedUploadTypesLabel} and no larger than ${LEGAL_FACTS.maxUploadSizeLabel} per file. Beyond that, content you submit must not:`,
        },
        {
          kind: "list",
          items: [
            "be unlawful, defamatory, obscene, sexually explicit, hateful, or discriminatory;",
            "depict violence, or the identifiable faces of uninvolved people, without a genuine need;",
            "infringe anyone's copyright, trade mark or other rights;",
            "contain malware, scripts or executable payloads;",
            "contain someone else's private information — bank details, identity documents, addresses — unless it is directly relevant and you have a lawful basis to submit it; or",
            "advertise, promote or link to any product, service or website.",
          ],
        },
        {
          kind: "paragraph",
          text: "Catcher is a registry, not a marketplace or a social platform. Do not use record fields to advertise or to communicate with the public.",
        },
      ],
    },
    {
      id: "technical",
      heading: "7. Technical restrictions",
      blocks: [
        {
          kind: "paragraph",
          text: "You must not:",
        },
        {
          kind: "list",
          items: [
            `scrape, crawl, mirror, index or systematically extract the public stolen items database, verification pages or any other part of the Service — public lookups are rate limited to approximately ${LEGAL_FACTS.publicLookupRateLimitLabel};`,
            "circumvent, disable or interfere with rate limiting, authentication, payment verification or any other security control;",
            "probe, scan or test the vulnerability of the Service without our prior written permission;",
            "access any account, record, API endpoint or administrative surface you are not authorised to access;",
            "reverse engineer, decompile or attempt to derive our source code, other than to the extent this restriction is unenforceable by law;",
            "use bots, scripts or automated tooling to create accounts, register property, file reports or trigger payments;",
            "send excessive traffic or otherwise degrade the performance or availability of the Service; or",
            "remove, obscure or alter any proprietary notice, verification identifier or QR code.",
          ],
        },
        {
          kind: "paragraph",
          text: `If you are a security researcher and you believe you have found a vulnerability, please report it privately to ${LEGAL_ENTITY.supportEmail} before disclosing it. We will not pursue action against researchers who act in good faith, avoid privacy violations and service disruption, and give us a reasonable time to fix the issue.`,
        },
      ],
    },
    {
      id: "payments-fraud",
      heading: "8. Payments and fraud",
      blocks: [
        {
          kind: "paragraph",
          text: "You must not use a payment instrument you are not authorised to use, attempt to obtain coverage without paying for it, manipulate checkout or webhook flows, or file a chargeback for a payment you know to be genuine.",
        },
        {
          kind: "paragraph",
          text: "Payment events are logged and verified against our payment processor. Coverage obtained through a reversed, fraudulent or manipulated payment will be cancelled and the property archived.",
        },
      ],
    },
    {
      id: "enforcement",
      heading: "9. How we enforce this policy",
      blocks: [
        {
          kind: "paragraph",
          text: "We respond proportionately to the seriousness of the breach. Depending on the circumstances we may:",
        },
        {
          kind: "list",
          items: [
            "contact you and ask you to correct the problem;",
            "edit, hide or remove a record, report, listing or upload;",
            "flag a property record so its status is visible to others;",
            "deactivate a public verification page;",
            "temporarily rate limit, restrict or suspend your account;",
            "cancel coverage without refund where the breach is serious;",
            "close your account permanently and refuse you future service; or",
            "report the matter to law enforcement or to a regulator, and preserve and disclose the relevant records as lawfully required.",
          ],
        },
        {
          kind: "paragraph",
          text: "We will normally tell you what we have done and why, and give you an opportunity to respond. We may act first and explain afterwards where there is an immediate risk to another user, to the integrity of the registry, or where telling you would prejudice an investigation.",
        },
        {
          kind: "paragraph",
          text: `If you believe we have acted wrongly, write to ${LEGAL_ENTITY.supportEmail} within 30 days and a different member of our team will review the decision.`,
        },
      ],
    },
    {
      id: "reporting-abuse",
      heading: "10. Reporting abuse",
      blocks: [
        {
          kind: "paragraph",
          text: `If you see a record, report or account that breaches this policy, tell us at ${LEGAL_ENTITY.supportEmail}. Include the verification ID, serial number or listing details, describe the problem, and attach anything that supports your report.`,
        },
        {
          kind: "paragraph",
          text: "We acknowledge abuse reports within five business days and prioritise those alleging a false stolen report, misuse of identity data, or an attempt to legitimise stolen goods.",
        },
      ],
    },
  ],
};
