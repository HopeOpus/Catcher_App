import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_ENTITY,
  LEGAL_LAST_UPDATED,
  LEGAL_VERSION,
} from "@/lib/legal/entity";
import { LEGAL_FACTS } from "@/lib/legal/facts";
import type { LegalDocument } from "@/lib/legal/types";

export const termsOfService: LegalDocument = {
  slug: "terms",
  title: "Terms of Service",
  shortTitle: "Terms of Service",
  summary:
    "The agreement between you and Catcher covering accounts, property registration, plans, public verification and stolen reporting.",
  intro: `These Terms of Service ("Terms") form a binding agreement between you and ${LEGAL_ENTITY.legalName}, trading as ${LEGAL_ENTITY.tradingName}. They govern your use of the Catcher website at ${LEGAL_ENTITY.websiteDomain}, the Catcher dashboard, the Catcher mobile application and every related service we operate (together, the "Service"). Please read them carefully — by creating an account or using any part of the Service, you accept them in full.`,
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  lastUpdated: LEGAL_LAST_UPDATED,
  version: LEGAL_VERSION,
  sections: [
    {
      id: "acceptance",
      heading: "1. Acceptance of these Terms",
      blocks: [
        {
          kind: "paragraph",
          text: "You accept these Terms when you create a Catcher account, register a property, submit a stolen property report, make a payment, or otherwise use the Service. If you do not agree with any part of these Terms, you must not use the Service.",
        },
        {
          kind: "paragraph",
          text: "If you are using Catcher on behalf of a business, organisation, cooperative or any other legal entity, you confirm that you have authority to bind that entity, and references to “you” in these Terms include that entity.",
        },
        {
          kind: "paragraph",
          text: "These Terms should be read together with our Privacy Policy, Acceptable Use Policy, Stolen Property Reporting & Verification Policy, Billing, Coverage & Refund Policy, and Cookie & Tracking Policy. Together they make up the full agreement between you and Catcher.",
        },
      ],
    },
    {
      id: "who-we-are",
      heading: "2. Who we are",
      blocks: [
        {
          kind: "paragraph",
          text: `The Service is operated by ${LEGAL_ENTITY.legalName} (${LEGAL_ENTITY.registrationNumber}), a company registered in the ${LEGAL_ENTITY.country}, with its registered office at ${LEGAL_ENTITY.registeredAddress}.`,
        },
        {
          kind: "paragraph",
          text: `You can reach us at ${LEGAL_ENTITY.supportEmail} for any question about these Terms, your account, billing or a record held on the Service.`,
        },
      ],
    },
    {
      id: "what-catcher-is",
      heading: "3. What Catcher is — and what it is not",
      blocks: [
        {
          kind: "paragraph",
          text: "Catcher is a property documentation and verification service. It lets you create structured, photo-backed records of valuables you own, publish a shareable verification page for each registered item, report items that are stolen, and check whether an item you are about to buy has been reported stolen by someone else.",
        },
        {
          kind: "callout",
          tone: "critical",
          title: "Catcher is not insurance, law enforcement, or proof of legal title",
          text: "Registering an item on Catcher does not insure it, does not create or transfer legal ownership, and does not constitute a government or statutory register of title. Catcher is not a police force, licensed investigator, or recovery agency, and cannot seize, recover or return property. A Catcher record is evidence that a particular account holder documented a particular item on a particular date — nothing more and nothing less.",
        },
        {
          kind: "paragraph",
          text: "The value of the Service depends on the accuracy of what users enter. We do not independently verify serial numbers, receipts, photographs, ownership claims, or the truth of any stolen property report before it is recorded. You must use your own judgement, and take your own independent steps, before relying on any record you see on Catcher.",
        },
        {
          kind: "paragraph",
          text: "Nothing on Catcher is legal advice, insurance advice, or financial advice.",
        },
      ],
    },
    {
      id: "eligibility",
      heading: "4. Eligibility",
      blocks: [
        {
          kind: "paragraph",
          text: "To use Catcher you must:",
        },
        {
          kind: "list",
          items: [
            "be at least 18 years old, or the age of majority in your jurisdiction if that is higher;",
            "have the legal capacity to enter into a binding contract;",
            "not be barred from using the Service under any applicable law, and not be a person previously removed from the Service by us;",
            "provide accurate, current and complete information about yourself; and",
            "only register property that you own, or that you are lawfully authorised to register on behalf of its owner.",
          ],
        },
        {
          kind: "paragraph",
          text: "Catcher is not intended for children. We do not knowingly allow anyone under 18 to hold an account.",
        },
      ],
    },
    {
      id: "your-account",
      heading: "5. Your account",
      blocks: [
        {
          kind: "paragraph",
          text: "Accounts are created and authenticated through our identity provider. You are responsible for everything that happens under your account, including any property record created, any stolen report filed, and any payment made.",
        },
        {
          kind: "paragraph",
          text: "You must:",
        },
        {
          kind: "list",
          items: [
            "keep your login credentials confidential and never share them;",
            "use a strong, unique password and enable any additional authentication factor we make available;",
            "keep your profile details — including your phone number and next-of-kin contact details — accurate and up to date, because we use them to reach you about coverage, payments and reports;",
            "notify us immediately at " +
              LEGAL_ENTITY.supportEmail +
              " if you suspect unauthorised access to your account.",
          ],
        },
        {
          kind: "paragraph",
          text: "Some parts of the Service require a complete profile before you can proceed. We may prompt you to supply missing details before you can register property or file a stolen report.",
        },
        {
          kind: "paragraph",
          text: "Catcher accounts are personal to you. You may not sell, rent, transfer or share your account with anyone else.",
        },
      ],
    },
    {
      id: "registering-property",
      heading: "6. Registering property",
      blocks: [
        {
          kind: "paragraph",
          text: "When you register an item you provide details such as its name, category, serial number or other unique identifier, a description, and supporting photographs. You may register vehicles, electronics, jewellery, documents and other categories of property we support.",
        },
        {
          kind: "paragraph",
          text: "By submitting a property record, you represent and warrant that:",
        },
        {
          kind: "ordered",
          items: [
            "you are the lawful owner of the item, or you have the owner's express authority to register it;",
            "every detail you supply is true, accurate and not misleading;",
            "the serial number or identifier you supply belongs to the item you are registering;",
            "you own the photographs you upload, or have permission to upload them; and",
            "registering the item does not infringe anyone else's rights and does not breach any law.",
          ],
        },
        {
          kind: "paragraph",
          text: `Uploads are limited to ${LEGAL_FACTS.allowedUploadTypesLabel}, up to ${LEGAL_FACTS.maxUploadSizeLabel} per file. We may reject, remove or replace any upload that breaches these Terms or our Acceptable Use Policy.`,
        },
        {
          kind: "paragraph",
          text: "We may flag, suspend or remove a property record where we have a reasonable basis to believe it is inaccurate, fraudulent, duplicated, or the subject of a credible ownership dispute. Where we do this, we will normally tell you and give you a chance to respond, unless we are legally prevented from doing so or doing so would prejudice an investigation.",
        },
      ],
    },
    {
      id: "plans-and-coverage",
      heading: "7. Plans, coverage and archiving",
      blocks: [
        {
          kind: "paragraph",
          text: "Coverage is purchased per property, not per account. Each registered item carries its own coverage record with its own start date, expiry date and status.",
        },
        {
          kind: "table",
          caption: "Plans available at the date of these Terms",
          columns: ["Plan", "Price", "Active coverage", "Grace period"],
          rows: [
            [
              "Free",
              "No charge",
              `${LEGAL_FACTS.freePlanLifetimeLimit} property per account, lifetime, no expiry`,
              "Not applicable",
            ],
            [
              "Monthly",
              LEGAL_FACTS.monthlyPrice,
              `${LEGAL_FACTS.monthlyDurationDays} days per property`,
              `${LEGAL_FACTS.gracePeriodDays} days`,
            ],
            [
              "Yearly",
              LEGAL_FACTS.yearlyPrice,
              `${LEGAL_FACTS.yearlyDurationDays} days per property`,
              `${LEGAL_FACTS.gracePeriodDays} days`,
            ],
          ],
        },
        {
          kind: "paragraph",
          text: `The free plan is limited to ${LEGAL_FACTS.freePlanLifetimeLimit} property registration per account for the lifetime of that account. It cannot be reused by deleting the property and registering another.`,
        },
        {
          kind: "paragraph",
          text: `When paid coverage expires, the property enters a ${LEGAL_FACTS.gracePeriodDays}-day grace period during which the record and its verification page stay live. If coverage is not renewed before the grace period ends, the property is archived: it is removed from public verification and from the public stolen items database, and it stops appearing as an actively covered item. Archived records remain restorable — renewing coverage brings the record back.`,
        },
        {
          kind: "paragraph",
          text: "Coverage transitions are applied automatically by our systems. We send reminders before expiry, but it is your responsibility to renew on time. We are not liable for the consequences of a lapse in coverage.",
        },
        {
          kind: "paragraph",
          text: "Full details of pricing, renewals, receipts and refunds are set out in our Billing, Coverage & Refund Policy.",
        },
      ],
    },
    {
      id: "payments",
      heading: "8. Payments",
      blocks: [
        {
          kind: "paragraph",
          text: "Paid plans are charged in Nigerian Naira (NGN) through our payment processor. Any amount shown in another currency, including US Dollars, is an indicative conversion based on a third-party reference rate and is provided for guidance only. The NGN amount presented at checkout is the amount you will be charged.",
        },
        {
          kind: "paragraph",
          text: "We do not receive or store your full card details. Card data is handled entirely by our payment processor under its own terms and security standards.",
        },
        {
          kind: "paragraph",
          text: "Coverage begins only once payment has been confirmed and verified against the payment processor. A payment that is initiated but not completed does not create coverage. If a payment is later reversed, charged back or found to be fraudulent, we may cancel the related coverage and archive the property.",
        },
        {
          kind: "paragraph",
          text: "We issue a billing receipt for every successful payment. Receipts are available in your dashboard.",
        },
      ],
    },
    {
      id: "public-verification",
      heading: "9. Public verification pages",
      blocks: [
        {
          kind: "paragraph",
          text: "Each registered property with live coverage is given a public verification page and a matching QR code. You can share this link or code with a buyer, an employer, a security officer or anyone else who needs to confirm that the item is documented on Catcher.",
        },
        {
          kind: "paragraph",
          text: "A verification page displays the item name, category, serial number, registration date, current status, plan and coverage dates, description and cover photograph. It deliberately does not display the owner's name, contact details, national identity number or next-of-kin information.",
        },
        {
          kind: "callout",
          tone: "warning",
          title: "What a verification page proves",
          text: "A live verification page confirms that a Catcher account holder registered this item and that coverage is currently active. It does not confirm that the person showing you the page is the registered owner, and it does not confirm that the item in front of you is the item described. Always inspect the physical serial number and satisfy yourself independently before you buy.",
        },
        {
          kind: "paragraph",
          text: "Verification pages become unavailable when coverage lapses past its grace period or when a record is archived, deactivated or removed.",
        },
      ],
    },
    {
      id: "stolen-reports",
      heading: "10. Reporting stolen property",
      blocks: [
        {
          kind: "paragraph",
          text: "If a registered item is stolen, you can convert its record into a stolen property report giving the date, the location, a description of the circumstances and supporting evidence images.",
        },
        {
          kind: "paragraph",
          text: "When you submit a stolen property report, you declare that the report is true to the best of your knowledge and that you are entitled to make it. Reports are published to the public stolen items database, where anyone can search them.",
        },
        {
          kind: "callout",
          tone: "critical",
          title: "Filing on Catcher is not filing with the police",
          text: "A Catcher stolen report is a private database entry. It does not open a criminal case, does not notify the Nigeria Police Force or any other authority, and does not satisfy any legal reporting obligation you may have. You should report the theft to the police separately and keep the official report or extract.",
        },
        {
          kind: "paragraph",
          text: "Knowingly filing a false or malicious stolen report is a serious breach of these Terms. It may also expose you to civil liability for defamation and to criminal liability under Nigerian law. We will remove reports we find to be false, may permanently close the responsible account, and may disclose the account details to law enforcement or to an affected party where lawfully required.",
        },
        {
          kind: "paragraph",
          text: "The full process — including report statuses, how to dispute a listing, and how we handle law enforcement requests — is set out in our Stolen Property Reporting & Verification Policy.",
        },
      ],
    },
    {
      id: "public-database",
      heading: "11. The public stolen items database",
      blocks: [
        {
          kind: "paragraph",
          text: "Catcher publishes reported stolen items so that buyers can check second-hand goods before purchase. The public listing shows the item name, serial number, date reported, location, description and report status.",
        },
        {
          kind: "paragraph",
          text: "The database is provided as a good-faith community resource on an “as is” basis. A negative result does not mean an item is not stolen: it may never have been registered, may have been stolen from someone who does not use Catcher, or may have been reported after you searched. A positive result reflects one user's unverified claim.",
        },
        {
          kind: "paragraph",
          text: `We apply rate limits to public lookups (currently around ${LEGAL_FACTS.publicLookupRateLimitLabel}) to keep the database available and to prevent bulk harvesting. You must not scrape, mirror, resell or systematically extract the database.`,
        },
      ],
    },
    {
      id: "acceptable-use",
      heading: "12. Acceptable use",
      blocks: [
        {
          kind: "paragraph",
          text: "You must use Catcher lawfully, honestly and in the way it was designed to be used. In particular, you must not:",
        },
        {
          kind: "list",
          items: [
            "register property you do not own and are not authorised to register;",
            "enter false, fabricated or deliberately misleading records or reports;",
            "use Catcher to launder, fence, disguise or legitimise stolen or illicit goods;",
            "harvest, scrape, resell or republish data obtained from the Service, including owner contact details returned by registry lookups;",
            "attempt to gain unauthorised access to any account, record, API or system;",
            "circumvent rate limits, authentication, payment flows or any other technical control;",
            "upload malware, or content that is unlawful, defamatory, obscene, hateful or infringing;",
            "impersonate any person or misrepresent your affiliation with any person or organisation; or",
            "use the Service in a way that damages, disables or overburdens it.",
          ],
        },
        {
          kind: "paragraph",
          text: "Our Acceptable Use Policy sets out these rules in full and forms part of these Terms.",
        },
      ],
    },
    {
      id: "your-content",
      heading: "13. Your content and the licence you grant us",
      blocks: [
        {
          kind: "paragraph",
          text: "You keep ownership of everything you upload to Catcher — your property records, photographs, descriptions and evidence files (“Your Content”).",
        },
        {
          kind: "paragraph",
          text: "To operate the Service, you grant us a worldwide, non-exclusive, royalty-free licence to host, store, reproduce, adapt for display, and transmit Your Content, strictly for the purposes of running and improving Catcher, including: showing it back to you in your dashboard; publishing the limited subset described in these Terms on public verification pages and in the public stolen items database; generating billing receipts and verification codes; and complying with law.",
        },
        {
          kind: "paragraph",
          text: "This licence lasts for as long as we hold the relevant content, and ends when the content is deleted, save where we must retain a copy for legal, accounting, audit or dispute-resolution reasons. We do not sell Your Content and we do not use it for advertising.",
        },
      ],
    },
    {
      id: "our-ip",
      heading: "14. Our intellectual property",
      blocks: [
        {
          kind: "paragraph",
          text: "The Catcher name, logo, brand, software, design, database structure, documentation and all other materials we provide are owned by us or licensed to us and are protected by intellectual property laws.",
        },
        {
          kind: "paragraph",
          text: "We grant you a limited, personal, non-exclusive, non-transferable and revocable licence to use the Service for its intended purpose while your account is in good standing. You may not copy, modify, reverse engineer, decompile, create derivative works from, or resell any part of the Service without our prior written consent.",
        },
      ],
    },
    {
      id: "third-parties",
      heading: "15. Third-party services",
      blocks: [
        {
          kind: "paragraph",
          text: "Catcher depends on trusted third parties for authentication, payment processing, image storage, transactional email, hosting and database infrastructure. Those providers act under their own terms and privacy notices, which we list in our Privacy Policy.",
        },
        {
          kind: "paragraph",
          text: "We are not responsible for the acts, omissions, availability or content of third-party services, and we are not liable for loss caused by an outage or failure originating with a provider outside our control.",
        },
      ],
    },
    {
      id: "availability",
      heading: "16. Availability and changes to the Service",
      blocks: [
        {
          kind: "paragraph",
          text: "We work to keep Catcher available, but we do not promise uninterrupted or error-free service. The Service may be unavailable during maintenance, upgrades, outages or events outside our control.",
        },
        {
          kind: "paragraph",
          text: "We may add, change, restrict or withdraw features. Where a change materially reduces a paid feature you are actively using, we will give you reasonable notice and, where appropriate, a pro-rata refund for the unused portion of that coverage.",
        },
      ],
    },
    {
      id: "suspension",
      heading: "17. Suspension and termination",
      blocks: [
        {
          kind: "paragraph",
          text: "You may stop using Catcher at any time and may ask us to close your account by writing to " +
            LEGAL_ENTITY.supportEmail +
            ". Closing your account does not automatically entitle you to a refund of coverage already purchased.",
        },
        {
          kind: "paragraph",
          text: "We may suspend or terminate your access, remove records, or refuse service if:",
        },
        {
          kind: "list",
          items: [
            "you breach these Terms or any policy that forms part of them;",
            "we reasonably believe a record or report is fraudulent, false or unlawful;",
            "a payment is reversed, charged back or found to be fraudulent;",
            "we are required to do so by law, a court order or a competent authority; or",
            "your use poses a security, legal or reputational risk to Catcher or to other users.",
          ],
        },
        {
          kind: "paragraph",
          text: "Where the breach is serious — for example a knowingly false stolen report, or use of Catcher to move stolen goods — we may act immediately and without notice.",
        },
        {
          kind: "paragraph",
          text: "On termination, your right to use the Service ends. Sections that by their nature should survive — including content licences already granted, disclaimers, limitation of liability, indemnity and governing law — continue to apply.",
        },
      ],
    },
    {
      id: "disclaimers",
      heading: "18. Disclaimers",
      blocks: [
        {
          kind: "paragraph",
          text: "To the fullest extent permitted by law, the Service is provided “as is” and “as available”, without warranties of any kind, whether express, implied or statutory, including any implied warranty of merchantability, fitness for a particular purpose, accuracy or non-infringement.",
        },
        {
          kind: "paragraph",
          text: "In particular, we do not warrant that:",
        },
        {
          kind: "list",
          items: [
            "any record on Catcher is accurate, complete or truthful;",
            "registering an item will prevent theft, or that reporting an item will lead to its recovery;",
            "the public stolen items database contains every stolen item, or that an item absent from it is not stolen;",
            "a verification page proves ownership or the identity of the person presenting it; or",
            "the Service will be uninterrupted, secure or free of errors.",
          ],
        },
        {
          kind: "paragraph",
          text: "Nothing in these Terms excludes any liability that cannot lawfully be excluded, including liability for death or personal injury caused by our negligence, or for fraud.",
        },
      ],
    },
    {
      id: "liability",
      heading: "19. Limitation of liability",
      blocks: [
        {
          kind: "paragraph",
          text: "To the fullest extent permitted by law, Catcher, its directors, employees and agents will not be liable for:",
        },
        {
          kind: "list",
          items: [
            "loss, theft, damage to or non-recovery of any property, whether registered on Catcher or not;",
            "any purchase decision you make in reliance on a verification page or a public database search;",
            "loss of profit, revenue, business, goodwill, data or anticipated savings;",
            "any indirect, special, incidental, punitive or consequential loss; or",
            "any act or omission of another user, including a false record or report.",
          ],
        },
        {
          kind: "paragraph",
          text: "Our total aggregate liability to you for all claims arising out of or connected with the Service in any twelve-month period is limited to the greater of (a) the total amount you paid to Catcher in that period, and (b) NGN 20,000.",
        },
        {
          kind: "paragraph",
          text: "You accept that Catcher is priced as a low-cost documentation service, not as an insurance product, and that this limitation reflects a fair allocation of risk between us.",
        },
      ],
    },
    {
      id: "indemnity",
      heading: "20. Indemnity",
      blocks: [
        {
          kind: "paragraph",
          text: "You agree to indemnify and hold Catcher harmless against any claim, demand, loss, liability, cost or expense (including reasonable legal fees) arising out of or connected with: your breach of these Terms or any policy forming part of them; any record, report or content you submit; your infringement of any third party's rights; or your use of the Service in breach of any law.",
        },
      ],
    },
    {
      id: "disputes",
      heading: "21. Governing law and disputes",
      blocks: [
        {
          kind: "paragraph",
          text: `These Terms and any dispute arising out of them are governed by the laws of the ${LEGAL_ENTITY.country}.`,
        },
        {
          kind: "paragraph",
          text: `If you have a complaint, please contact us first at ${LEGAL_ENTITY.legalEmail}. We will acknowledge your complaint within five business days and work with you in good faith to resolve it.`,
        },
        {
          kind: "paragraph",
          text: "If a dispute cannot be resolved informally within thirty days, it will be submitted to the exclusive jurisdiction of the courts of Nigeria. Nothing prevents either party from seeking urgent injunctive relief from any court of competent jurisdiction.",
        },
      ],
    },
    {
      id: "changes",
      heading: "22. Changes to these Terms",
      blocks: [
        {
          kind: "paragraph",
          text: "We may update these Terms as Catcher develops and as the law changes. The version shown on this page, with its effective date and version number, is always the current one.",
        },
        {
          kind: "paragraph",
          text: "For material changes we will give you at least fourteen days' notice by email or by an in-product notice before they take effect. Continuing to use the Service after that date means you accept the updated Terms. If you do not accept them, you should stop using the Service and may ask us to close your account.",
        },
      ],
    },
    {
      id: "general",
      heading: "23. General",
      blocks: [
        {
          kind: "definitions",
          items: [
            {
              term: "Entire agreement",
              text: "These Terms, together with the policies referenced in them, are the entire agreement between you and Catcher about the Service, and replace any earlier understanding.",
            },
            {
              term: "Severability",
              text: "If any provision is found unenforceable, the rest of these Terms continue in force and the unenforceable provision is modified to the minimum extent needed to make it enforceable.",
            },
            {
              term: "No waiver",
              text: "If we do not enforce a right immediately, we do not give it up.",
            },
            {
              term: "Assignment",
              text: "You may not assign or transfer these Terms without our written consent. We may assign them to an affiliate or to a successor in connection with a merger, acquisition or sale of assets.",
            },
            {
              term: "Notices",
              text: `We will send notices to the email address on your account. You should send notices to ${LEGAL_ENTITY.legalEmail}.`,
            },
          ],
        },
      ],
    },
    {
      id: "contact",
      heading: "24. Contact us",
      blocks: [
        {
          kind: "paragraph",
          text: `Questions about these Terms can be sent to ${LEGAL_ENTITY.legalEmail}, or by post to ${LEGAL_ENTITY.legalName}, ${LEGAL_ENTITY.registeredAddress}.`,
        },
      ],
    },
  ],
};
