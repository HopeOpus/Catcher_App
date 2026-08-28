import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_ENTITY,
  LEGAL_LAST_UPDATED,
  LEGAL_VERSION,
} from "@/lib/legal/entity";
import { LEGAL_FACTS } from "@/lib/legal/facts";
import type { LegalDocument } from "@/lib/legal/types";

export const privacyPolicy: LegalDocument = {
  slug: "privacy",
  title: "Privacy Policy",
  shortTitle: "Privacy Policy",
  summary:
    "What personal data Catcher collects, why we collect it, who we share it with, how long we keep it, and the rights you have over it.",
  intro: `This Privacy Policy explains how ${LEGAL_ENTITY.legalName}, trading as ${LEGAL_ENTITY.tradingName}, collects, uses, shares and protects personal data when you use the Catcher website, dashboard and mobile application. It is written to meet our obligations under the Nigeria Data Protection Act 2023 and the Nigeria Data Protection Regulation, and it explains the rights those laws give you.`,
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  lastUpdated: LEGAL_LAST_UPDATED,
  version: LEGAL_VERSION,
  sections: [
    {
      id: "summary",
      heading: "1. The short version",
      blocks: [
        {
          kind: "paragraph",
          text: "We collect what we need to run a property registry: who you are, how to reach you, what you have registered, what you have reported stolen, and what you have paid. We publish a deliberately limited subset of that on public pages. We never sell your data, and we never use it for advertising.",
        },
        {
          kind: "list",
          items: [
            "Your name, contact details, national identity number and next-of-kin details are never shown on a public verification page.",
            "Item details you report stolen — including the serial number, location and description — are published in the public stolen items database, because that is the point of reporting.",
            "We use trusted providers for login, payments, image storage, email and hosting. Some of them process data outside Nigeria.",
            "You can access, correct, export or delete your data by writing to " +
              LEGAL_ENTITY.privacyEmail +
              ".",
          ],
        },
        {
          kind: "paragraph",
          text: "The sections below give the full detail. This summary does not replace them.",
        },
      ],
    },
    {
      id: "controller",
      heading: "2. Who is responsible for your data",
      blocks: [
        {
          kind: "paragraph",
          text: `${LEGAL_ENTITY.legalName} (${LEGAL_ENTITY.registrationNumber}), of ${LEGAL_ENTITY.registeredAddress}, is the data controller for the personal data described in this policy. That means we decide why and how your data is processed, and we are accountable for it.`,
        },
        {
          kind: "paragraph",
          text: `For any privacy question, request or complaint, contact our data protection contact at ${LEGAL_ENTITY.privacyEmail} with “Privacy request” in the subject line.`,
        },
      ],
    },
    {
      id: "data-we-collect",
      heading: "3. The personal data we collect",
      blocks: [
        {
          kind: "paragraph",
          text: "We group the data we hold into the following categories.",
        },
        {
          kind: "table",
          columns: ["Category", "What it includes", "Where it comes from"],
          rows: [
            [
              "Account and identity data",
              "Your name, email address, account role, profile photograph, phone number, and — where you supply it — your National Identification Number (NIN).",
              "You, at sign-up and when completing your profile.",
            ],
            [
              "Next-of-kin data",
              "The name, email address and phone number of the person you nominate as your next of kin.",
              "You. You are responsible for having their permission before you supply it.",
            ],
            [
              "Property records",
              "Item name, category, serial number or identifier, description, registration date, status, cover photograph and additional photographs.",
              "You, when registering or editing a property.",
            ],
            [
              "Stolen report data",
              "The item reported, its serial number, the date and location of the theft, your description of the circumstances, evidence images, and the report status.",
              "You, when filing a report. Status changes come from our review team.",
            ],
            [
              "Coverage and billing data",
              "The plan you chose, the amount charged, currency, transaction reference, payment status, coverage start, expiry and grace dates, renewal history, and the billing receipt issued to you.",
              "You and our payment processor.",
            ],
            [
              "Payment event records",
              "Transaction references, provider event types, transaction identifiers, environment, amounts, statuses and provider payloads relating to your payments.",
              "Our payment processor, via checkout, verification and webhook events.",
            ],
            [
              "Communications data",
              "Notifications we generate for you in the product, the transactional emails we send you, delivery status, and any correspondence you send our support team.",
              "Our systems, our email provider, and you.",
            ],
            [
              "Verification data",
              "The public verification slug, token and active status generated for each covered property, and the QR code derived from it.",
              "Generated by our systems.",
            ],
            [
              "Administrative records",
              "Audit log entries recording actions taken on records, and internal notes our administrators write when reviewing an account, property or report.",
              "Our administrators and our systems.",
            ],
            [
              "Technical and security data",
              "IP address or a derived identifier, request timing and counts used for rate limiting and abuse prevention, device and browser information, and server logs.",
              "Automatically, when you use the Service.",
            ],
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          title: "Please do not upload data you do not need to",
          text: "Photographs and evidence files can contain more than you intend — faces of bystanders, documents in the background, or location metadata. Only upload what is necessary to identify the item, and redact anything sensitive before you upload it.",
        },
      ],
    },
    {
      id: "sensitive-data",
      heading: "4. National identity numbers and sensitive data",
      blocks: [
        {
          kind: "paragraph",
          text: "Where you supply a National Identification Number (NIN), we treat it as high-risk identity data. It is stored under access control, is never displayed on any public page, and is not included in the public stolen items database or in any public verification page.",
        },
        {
          kind: "paragraph",
          text: "A NIN may be visible to a signed-in user performing an authenticated registry lookup on a property record, and to our administrators when handling a support case, a dispute or a lawful request. Misusing identity data obtained this way is a serious breach of our Acceptable Use Policy and may be a criminal offence.",
        },
        {
          kind: "paragraph",
          text: "We do not deliberately collect special-category data such as health, biometric, religious or political data. Please do not submit it.",
        },
      ],
    },
    {
      id: "why-we-use",
      heading: "5. Why we use your data, and our lawful basis",
      blocks: [
        {
          kind: "paragraph",
          text: "Under the Nigeria Data Protection Act 2023 we must have a lawful basis for every use of your data. Ours are set out below.",
        },
        {
          kind: "table",
          columns: ["Purpose", "Data used", "Lawful basis"],
          rows: [
            [
              "Creating and securing your account",
              "Account and identity data, technical data",
              "Performance of our contract with you",
            ],
            [
              "Maintaining your property records and dashboard",
              "Property records, coverage data",
              "Performance of our contract with you",
            ],
            [
              "Publishing public verification pages",
              "Non-personal item details only",
              "Performance of our contract with you (you request the page by registering the item)",
            ],
            [
              "Publishing the public stolen items database",
              "Stolen report data",
              "Performance of our contract with you, and our legitimate interest in helping the public avoid buying stolen goods",
            ],
            [
              "Taking payment and issuing receipts",
              "Coverage and billing data, payment event records",
              "Performance of our contract with you, and compliance with tax and accounting obligations",
            ],
            [
              "Sending service notifications, expiry reminders and payment confirmations",
              "Account data, coverage data, communications data",
              "Performance of our contract with you",
            ],
            [
              "Contacting your next of kin where an account or property matter requires it",
              "Next-of-kin data",
              "Our legitimate interest in reaching an account holder or their nominated contact",
            ],
            [
              "Preventing fraud, abuse and false reports",
              "Technical and security data, audit records, administrative notes",
              "Our legitimate interest in protecting users and the integrity of the registry",
            ],
            [
              "Rate limiting and protecting service availability",
              "Technical and security data",
              "Our legitimate interest in keeping the Service available",
            ],
            [
              "Handling support requests, disputes and takedown claims",
              "Any relevant category",
              "Performance of our contract with you, and our legitimate interest in resolving disputes fairly",
            ],
            [
              "Meeting legal obligations and responding to lawful requests",
              "Any relevant category",
              "Compliance with a legal obligation",
            ],
            [
              "Improving the Service and diagnosing faults",
              "Aggregated and technical data",
              "Our legitimate interest in improving the Service",
            ],
          ],
        },
        {
          kind: "paragraph",
          text: "Where we rely on legitimate interests, we have considered the impact on you and are satisfied that our interest does not override your rights. You can object to that processing — see “Your rights” below.",
        },
      ],
    },
    {
      id: "what-is-public",
      heading: "6. What Catcher makes public",
      blocks: [
        {
          kind: "paragraph",
          text: "Catcher only works if some information can be checked by people who do not have an account. We keep that set as small as possible.",
        },
        {
          kind: "table",
          columns: ["Surface", "Published", "Never published"],
          rows: [
            [
              "Public verification page (/verify)",
              "Item name, category, serial number, registration date, item status, plan name, plan status, coverage expiry, description, cover photograph, verification ID and QR code.",
              "Owner name, email, phone number, NIN, profile photo, next-of-kin details, payment details, receipts.",
            ],
            [
              "Public stolen items database (/stolen-items)",
              "Item name, serial number, date reported, location of the incident, description and report status.",
              "Owner name, email, phone number, NIN, next-of-kin details, evidence images, payment details.",
            ],
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          title: "Think before you type",
          text: "The location and description fields of a stolen report are public. Do not enter your home address, a place of work, an account number, a vehicle location you still use, or anything else you would not want a stranger to read. Describe the incident, not your private life.",
        },
        {
          kind: "paragraph",
          text: "When coverage lapses beyond its grace period and a property is archived, its verification page and its stolen listing are removed from public view.",
        },
        {
          kind: "paragraph",
          text: "Signed-in users can perform registry lookups that return the registered owner's name, email address, phone number and, where supplied, NIN and next-of-kin contact. This exists so that a finder or a prospective buyer can reach an owner. It is logged, rate limited, and restricted to authenticated accounts.",
        },
      ],
    },
    {
      id: "sharing",
      heading: "7. Who we share your data with",
      blocks: [
        {
          kind: "paragraph",
          text: "We do not sell your personal data. We share it only with the service providers we need to run Catcher, each acting as our processor under a written agreement, and with the recipients listed below.",
        },
        {
          kind: "table",
          columns: ["Recipient", "Role", "Data shared"],
          rows: [
            [
              "Clerk",
              "Authentication and account identity",
              "Email address, name, profile image, authentication events and session data",
            ],
            [
              "Paystack",
              "Payment processing",
              "Name, email address, transaction amount, reference and payment metadata",
            ],
            [
              "Cloudinary",
              "Image storage and delivery",
              "Property photographs and stolen report evidence images",
            ],
            [
              "Resend",
              "Transactional email delivery",
              "Recipient email address, subject and message content",
            ],
            [
              "Neon",
              "Managed PostgreSQL database hosting",
              "All stored application data",
            ],
            [
              "Vercel",
              "Application hosting and delivery",
              "Request data, IP address and server logs",
            ],
            [
              "Frankfurter",
              "Public currency reference rates",
              "No personal data — we request an NGN/USD rate only",
            ],
            [
              "Professional advisers",
              "Legal, accounting and audit support",
              "Only what is necessary for the matter concerned",
            ],
            [
              "Law enforcement and regulators",
              "Lawful requests, investigations and legal claims",
              "Only what we are lawfully required or permitted to disclose",
            ],
            [
              "A successor entity",
              "Merger, acquisition or sale of assets",
              "Account and record data, subject to this policy continuing to apply",
            ],
          ],
        },
        {
          kind: "paragraph",
          text: "Our processors may only use your data on our instructions, must keep it secure and confidential, and must delete or return it when their engagement ends.",
        },
      ],
    },
    {
      id: "transfers",
      heading: "8. International transfers",
      blocks: [
        {
          kind: "paragraph",
          text: "Several of our providers store or process data outside Nigeria, including in the United States and the European Union. Where we transfer personal data out of Nigeria, we do so in reliance on one or more of the safeguards permitted by the Nigeria Data Protection Act 2023, which may include an adequacy determination by the Nigeria Data Protection Commission, contractual clauses imposing equivalent protection, or the necessity of the transfer for the performance of our contract with you.",
        },
        {
          kind: "paragraph",
          text: `You can ask us for details of the safeguards applying to a specific transfer by writing to ${LEGAL_ENTITY.privacyEmail}.`,
        },
      ],
    },
    {
      id: "retention",
      heading: "9. How long we keep your data",
      blocks: [
        {
          kind: "paragraph",
          text: "We keep data only as long as we need it for the purpose it was collected for, plus any period we are legally required to retain it.",
        },
        {
          kind: "table",
          columns: ["Data", "Retention"],
          rows: [
            [
              "Account and profile data",
              "For as long as your account is open, then up to 24 months after closure to handle disputes and legal claims.",
            ],
            [
              "Property records and photographs",
              "For as long as the record exists. Archived records are retained in restorable form so you can reinstate coverage; you can ask us to delete them permanently.",
            ],
            [
              "Stolen reports and evidence",
              "For as long as the report is open, and for up to 7 years after it is resolved or withdrawn, because these records may be needed as evidence.",
            ],
            [
              "Billing receipts, coverage and payment event records",
              "At least 6 years from the end of the relevant financial year, to meet Nigerian tax and accounting requirements.",
            ],
            [
              "Audit logs and administrative notes",
              "Up to 7 years, to support investigations, dispute resolution and accountability.",
            ],
            [
              "Notifications and email delivery logs",
              "Up to 24 months.",
            ],
            [
              "Rate limiting and security records",
              "Short-lived; typically purged within 30 days of the window closing.",
            ],
          ],
        },
        {
          kind: "paragraph",
          text: "When a retention period ends we delete the data or irreversibly anonymise it so it can no longer be linked to you.",
        },
      ],
    },
    {
      id: "security",
      heading: "10. How we protect your data",
      blocks: [
        {
          kind: "paragraph",
          text: "We take the security of the registry seriously, because a property registry is only useful if it can be trusted. Our measures include:",
        },
        {
          kind: "list",
          items: [
            "encrypted transport (HTTPS/TLS) for all traffic between you and the Service;",
            "encryption of data at rest by our database and storage providers;",
            "authentication handled by a specialist identity provider, so we never hold your password;",
            "role-based access control, with administrative capability restricted to a small number of accounts;",
            "an audit log recording administrative actions taken on records;",
            "signature verification on payment webhooks, so we only act on genuine payment events;",
            "rate limiting on public lookup surfaces to prevent bulk harvesting and abuse; and",
            `upload restrictions permitting only ${LEGAL_FACTS.allowedUploadTypesLabel} up to ${LEGAL_FACTS.maxUploadSizeLabel}.`,
          ],
        },
        {
          kind: "paragraph",
          text: "No system is perfectly secure. You also play a part: use a strong unique password, keep your email account secure, and tell us straight away if you think your account has been accessed by someone else.",
        },
      ],
    },
    {
      id: "your-rights",
      heading: "11. Your rights",
      blocks: [
        {
          kind: "paragraph",
          text: "Under the Nigeria Data Protection Act 2023, and comparable laws that may apply to you, you have the following rights.",
        },
        {
          kind: "definitions",
          items: [
            {
              term: "Access",
              text: "Ask for a copy of the personal data we hold about you, and information about how we use it.",
            },
            {
              term: "Rectification",
              text: "Ask us to correct data that is inaccurate or incomplete. Most profile and property details you can correct yourself in the dashboard.",
            },
            {
              term: "Erasure",
              text: "Ask us to delete your data where we no longer need it. We may refuse where we must keep it — for example a billing receipt required for tax, or a stolen report connected to a live dispute or investigation.",
            },
            {
              term: "Restriction",
              text: "Ask us to pause processing while a dispute about accuracy or lawfulness is resolved.",
            },
            {
              term: "Objection",
              text: "Object to processing we carry out on the basis of legitimate interests, including a public stolen listing you believe should not stand.",
            },
            {
              term: "Portability",
              text: "Receive the data you gave us in a structured, commonly used, machine-readable format, or ask us to send it to another controller where technically feasible.",
            },
            {
              term: "Withdraw consent",
              text: "Where we rely on your consent, withdraw it at any time. This does not affect processing already carried out.",
            },
            {
              term: "Complain",
              text: "Lodge a complaint with the Nigeria Data Protection Commission if you believe we have handled your data unlawfully. We would appreciate the chance to resolve it with you first.",
            },
          ],
        },
      ],
    },
    {
      id: "exercise-rights",
      heading: "12. How to exercise your rights",
      blocks: [
        {
          kind: "paragraph",
          text: `Send your request to ${LEGAL_ENTITY.privacyEmail} from the email address on your Catcher account, telling us which right you want to exercise and what data it concerns.`,
        },
        {
          kind: "paragraph",
          text: "We will acknowledge your request promptly and respond within 30 days. If your request is complex we may extend that period, and we will tell you why. We may need to verify your identity before we act, particularly for access, erasure or portability requests.",
        },
        {
          kind: "paragraph",
          text: "We do not charge for handling a request. If a request is manifestly unfounded or repetitive we may charge a reasonable fee or decline it, and we will explain our reasoning.",
        },
      ],
    },
    {
      id: "automated",
      heading: "13. Automated processing",
      blocks: [
        {
          kind: "paragraph",
          text: "Catcher applies some rules automatically. Scheduled jobs move coverage from active, to grace period, to archived, based on the dates on your record, and generate the reminders and notifications that go with those transitions. Rate limiting temporarily blocks a visitor who exceeds our public lookup thresholds.",
        },
        {
          kind: "paragraph",
          text: "These are rule-based operational processes, not profiling. We do not carry out automated decision-making that produces legal or similarly significant effects on you. If an automated action affects your record and you believe it is wrong, contact us and a person will review it.",
        },
      ],
    },
    {
      id: "children",
      heading: "14. Children",
      blocks: [
        {
          kind: "paragraph",
          text: "Catcher is not directed at children and we do not knowingly collect data from anyone under 18. If you believe a child has given us personal data, contact us and we will delete it.",
        },
      ],
    },
    {
      id: "breach",
      heading: "15. Data breaches",
      blocks: [
        {
          kind: "paragraph",
          text: "We maintain a process for detecting, investigating and reporting personal data breaches. Where a breach is likely to result in a risk to your rights and freedoms, we will notify the Nigeria Data Protection Commission within 72 hours of becoming aware of it, and will inform affected users without undue delay where the risk to them is high.",
        },
      ],
    },
    {
      id: "changes",
      heading: "16. Changes to this policy",
      blocks: [
        {
          kind: "paragraph",
          text: "We will update this policy when our processing changes or when the law requires it. The effective date and version at the top of this page always reflect the current version. Where a change materially affects how we use your data, we will notify you by email or in-product notice before it takes effect.",
        },
      ],
    },
    {
      id: "contact",
      heading: "17. Contact us",
      blocks: [
        {
          kind: "paragraph",
          text: `Write to ${LEGAL_ENTITY.privacyEmail}, or to ${LEGAL_ENTITY.legalName}, ${LEGAL_ENTITY.registeredAddress}. If you are not satisfied with our response you may complain to the Nigeria Data Protection Commission.`,
        },
      ],
    },
  ],
};
