import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_ENTITY,
  LEGAL_LAST_UPDATED,
  LEGAL_VERSION,
} from "@/lib/legal/entity";
import type { LegalDocument } from "@/lib/legal/types";

export const cookiePolicy: LegalDocument = {
  slug: "cookies",
  title: "Cookie & Tracking Policy",
  shortTitle: "Cookies",
  summary:
    "The small number of cookies Catcher uses to keep you signed in and the Service secure — and the ones we deliberately do not use.",
  intro:
    "Catcher uses cookies and similar technologies sparingly. This policy explains which ones we set, what each is for, and how you can control them.",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  lastUpdated: LEGAL_LAST_UPDATED,
  version: LEGAL_VERSION,
  sections: [
    {
      id: "overview",
      heading: "1. Our approach",
      blocks: [
        {
          kind: "callout",
          tone: "positive",
          title: "No advertising, no third-party tracking",
          text: "Catcher does not run advertising, does not sell data to advertisers, does not embed advertising networks or social media trackers, and does not build behavioural profiles of visitors. The cookies we use exist to keep you signed in, to keep your session safe, and to remember basic preferences.",
        },
        {
          kind: "paragraph",
          text: "Because we do not use advertising or profiling cookies, we do not show an intrusive consent banner. The cookies we do set are strictly necessary to deliver a service you have asked for.",
        },
      ],
    },
    {
      id: "what-are-cookies",
      heading: "2. What cookies are",
      blocks: [
        {
          kind: "paragraph",
          text: "A cookie is a small text file a website stores in your browser. It lets the site recognise your browser on the next request — which is how you stay signed in as you move between pages.",
        },
        {
          kind: "paragraph",
          text: "Related technologies work the same way. Local storage and session storage keep small values in your browser without sending them on every request. This policy covers all of them.",
        },
      ],
    },
    {
      id: "cookies-we-use",
      heading: "3. The cookies we use",
      blocks: [
        {
          kind: "table",
          columns: ["Type", "Purpose", "Set by", "Lifetime"],
          rows: [
            [
              "Authentication and session",
              "Keeps you signed in as you move around the dashboard, and links your requests to your account.",
              "Clerk, our identity provider",
              "Session, or until you sign out",
            ],
            [
              "Security",
              "Protects against cross-site request forgery, session fixation and other attacks on your account.",
              "Catcher and Clerk",
              "Session",
            ],
            [
              "Payment flow",
              "Carries your checkout session through the payment provider and back so we can match the payment to the right property.",
              "Paystack",
              "Short-lived, for the duration of checkout",
            ],
            [
              "Preferences",
              "Remembers interface preferences such as your theme choice.",
              "Catcher",
              "Up to 12 months",
            ],
            [
              "Infrastructure",
              "Routing, load balancing and abuse prevention performed by our hosting provider.",
              "Vercel",
              "Session to short-lived",
            ],
          ],
        },
        {
          kind: "paragraph",
          text: "We also use server-side records — not cookies — to apply rate limits to public lookups. These are described in our Privacy Policy under technical and security data.",
        },
      ],
    },
    {
      id: "not-used",
      heading: "4. What we do not use",
      blocks: [
        {
          kind: "list",
          items: [
            "advertising or retargeting cookies;",
            "third-party social media tracking pixels;",
            "cross-site behavioural profiling;",
            "cookies that sell or share your data with data brokers; and",
            "fingerprinting techniques designed to identify you across unrelated websites.",
          ],
        },
        {
          kind: "paragraph",
          text: "If this ever changes, we will update this policy and ask for your consent before setting any non-essential cookie.",
        },
      ],
    },
    {
      id: "third-party",
      heading: "5. Third parties",
      blocks: [
        {
          kind: "paragraph",
          text: "Some parts of the Service are delivered by providers who may set their own cookies when you interact with them: our identity provider during sign-in, our payment processor during checkout, our image provider when loading photographs, and our hosting provider on every request.",
        },
        {
          kind: "paragraph",
          text: "Those cookies are governed by each provider's own cookie and privacy notices. We list our providers, and what they process, in our Privacy Policy.",
        },
      ],
    },
    {
      id: "managing",
      heading: "6. Managing cookies",
      blocks: [
        {
          kind: "paragraph",
          text: "You can view, block and delete cookies through your browser settings, usually under Privacy or Site Settings. You can also use private browsing, or clear site data for " +
            LEGAL_ENTITY.websiteDomain +
            " specifically.",
        },
        {
          kind: "callout",
          tone: "warning",
          title: "Blocking essential cookies breaks sign-in",
          text: "Authentication depends on cookies. If you block them for this site you will not be able to sign in, reach your dashboard, or complete a payment. Public pages — the stolen items database and verification pages — will still work.",
        },
      ],
    },
    {
      id: "changes",
      heading: "7. Changes to this policy",
      blocks: [
        {
          kind: "paragraph",
          text: "We will update this policy if the cookies we use change. The effective date and version at the top of this page always reflect the current version.",
        },
      ],
    },
    {
      id: "contact",
      heading: "8. Contact us",
      blocks: [
        {
          kind: "paragraph",
          text: `Questions about cookies or tracking can be sent to ${LEGAL_ENTITY.privacyEmail}.`,
        },
      ],
    },
  ],
};
