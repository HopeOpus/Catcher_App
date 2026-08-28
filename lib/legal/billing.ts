import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_ENTITY,
  LEGAL_LAST_UPDATED,
  LEGAL_VERSION,
} from "@/lib/legal/entity";
import { LEGAL_FACTS } from "@/lib/legal/facts";
import type { LegalDocument } from "@/lib/legal/types";

export const billingPolicy: LegalDocument = {
  slug: "billing",
  title: "Billing, Coverage & Refund Policy",
  shortTitle: "Billing & Refunds",
  summary:
    "Plans and prices, how coverage runs and expires, receipts, renewals, refunds and chargebacks.",
  intro:
    "Catcher charges per property, not per account. This policy explains what each plan costs, how long coverage lasts, what happens when it expires, and when you can get your money back.",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  lastUpdated: LEGAL_LAST_UPDATED,
  version: LEGAL_VERSION,
  sections: [
    {
      id: "plans",
      heading: "1. Plans and prices",
      blocks: [
        {
          kind: "paragraph",
          text: "Coverage is bought for a single property. Registering three items on paid plans means three separate coverage records, each with its own dates.",
        },
        {
          kind: "table",
          columns: ["Plan", "Price per property", "Active coverage", "Grace period", "Notes"],
          rows: [
            [
              "Free",
              "No charge",
              "No expiry",
              "Not applicable",
              `Limited to ${LEGAL_FACTS.freePlanLifetimeLimit} property for the lifetime of the account`,
            ],
            [
              "Monthly",
              LEGAL_FACTS.monthlyPrice,
              `${LEGAL_FACTS.monthlyDurationDays} days`,
              `${LEGAL_FACTS.gracePeriodDays} days`,
              "Charged once per purchase, not as an automatic recurring debit",
            ],
            [
              "Yearly",
              LEGAL_FACTS.yearlyPrice,
              `${LEGAL_FACTS.yearlyDurationDays} days`,
              `${LEGAL_FACTS.gracePeriodDays} days`,
              "Best value per day of coverage",
            ],
          ],
        },
        {
          kind: "paragraph",
          text: `The free plan allows ${LEGAL_FACTS.freePlanLifetimeLimit} property registration per account, once, for the life of that account. Deleting the free property does not restore the allowance, and creating additional accounts to obtain more free registrations breaches our Acceptable Use Policy.`,
        },
        {
          kind: "paragraph",
          text: "Prices shown in the dashboard at the moment of checkout are the prices that apply. The prices in this policy are current as at the effective date above.",
        },
      ],
    },
    {
      id: "currency",
      heading: "2. Currency",
      blocks: [
        {
          kind: "paragraph",
          text: "All charges are made in Nigerian Naira (NGN). Internally, amounts are held in kobo for precision.",
        },
        {
          kind: "callout",
          tone: "info",
          title: "US Dollar figures are indicative only",
          text: "Where we show an approximate USD amount, it is converted using a public reference rate from a third-party provider and refreshed periodically. It is shown to help you judge the cost, not as a quoted price. The NGN amount at checkout is the amount that will be charged, and your bank may apply its own conversion and fees.",
        },
      ],
    },
    {
      id: "payment-processing",
      heading: "3. How payment works",
      blocks: [
        {
          kind: "paragraph",
          text: "Payments are processed by Paystack. When you choose a paid plan we create a checkout session, send you to the processor to pay, and then verify the outcome directly with the processor before we do anything to your record.",
        },
        {
          kind: "paragraph",
          text: "We never see or store your full card details. The processor handles card data under its own terms and security standards.",
        },
        {
          kind: "paragraph",
          text: "Coverage starts only when payment has been confirmed and verified. A checkout you begin but do not complete creates no coverage and expires on its own. If you were charged but your record did not update, contact us with the transaction reference and we will reconcile it.",
        },
        {
          kind: "paragraph",
          text: "Every payment event is logged, and webhook events are signature-verified so we act only on genuine notifications from the processor.",
        },
      ],
    },
    {
      id: "coverage-lifecycle",
      heading: "4. How coverage runs",
      blocks: [
        {
          kind: "paragraph",
          text: "Each coverage record moves through defined states, applied automatically by scheduled jobs.",
        },
        {
          kind: "definitions",
          items: [
            {
              term: "Scheduled",
              text: "Coverage has been paid for but its start date is in the future — this happens when you renew early and we extend from the existing expiry rather than overwrite it.",
            },
            {
              term: "Active",
              text: "Coverage is live. The property appears in your dashboard, its public verification page works, and stolen reporting is available for it.",
            },
            {
              term: "Grace",
              text: `Coverage has expired but the ${LEGAL_FACTS.gracePeriodDays}-day grace period is still running. Everything continues to work, and we send you reminders to renew.`,
            },
            {
              term: "Archived",
              text: "The grace period ended without renewal. The property is removed from public verification and from the public stolen items database, and stops counting as covered. The record itself is retained and is restorable.",
            },
            {
              term: "Cancelled",
              text: "Coverage was cancelled by you or by us — for example after a reversed payment or a serious policy breach.",
            },
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          title: "Archiving is automatic",
          text: `We send reminders before expiry and during the grace period, but archiving happens on schedule whether or not you saw them. Keep your email address and phone number current, and renew before the ${LEGAL_FACTS.gracePeriodDays}-day grace period ends.`,
        },
      ],
    },
    {
      id: "renewals",
      heading: "5. Renewals and restoring archived property",
      blocks: [
        {
          kind: "paragraph",
          text: "Paid plans are not automatic recurring debits. You renew each property when you choose to, from the dashboard.",
        },
        {
          kind: "paragraph",
          text: "If you renew before the current coverage expires, the new term is added to the end of the existing one — you do not lose the days you already paid for. If you renew after expiry, the new term starts from the date the renewal is confirmed.",
        },
        {
          kind: "paragraph",
          text: "An archived property can be restored by purchasing new coverage for it. Restoring brings back the record, its photographs and its verification page. It does not retrospectively cover the period during which the property was archived.",
        },
      ],
    },
    {
      id: "receipts",
      heading: "6. Receipts",
      blocks: [
        {
          kind: "paragraph",
          text: "We issue a billing receipt for every successful payment. Each receipt carries a unique receipt number and records the plan, amount, currency, transaction reference, the property covered, and the coverage start and expiry dates.",
        },
        {
          kind: "paragraph",
          text: "Receipts are available in your dashboard and can be shared or printed. We retain them for at least six years to meet Nigerian tax and accounting requirements, which means a receipt survives the deletion of the underlying property record.",
        },
      ],
    },
    {
      id: "refunds",
      heading: "7. Refunds",
      blocks: [
        {
          kind: "paragraph",
          text: "Catcher is a low-cost digital service and coverage begins as soon as payment is confirmed. Payments are therefore generally non-refundable. We will, however, issue a refund in the circumstances below.",
        },
        {
          kind: "table",
          columns: ["Situation", "Outcome"],
          rows: [
            [
              "You were charged more than once for the same coverage",
              "Full refund of the duplicate charge",
            ],
            [
              "You were charged but coverage was never activated, and we cannot activate it",
              "Full refund",
            ],
            [
              "A technical fault on our side made the covered property unusable for a material part of its term",
              "Pro-rata refund or extended coverage, at your choice",
            ],
            [
              "We withdraw or materially reduce a paid feature you were actively using",
              "Pro-rata refund for the unused portion",
            ],
            [
              "You request a refund within 48 hours of purchase and have not used the coverage — no verification page shared, no stolen report filed",
              "Full refund, at our discretion",
            ],
            [
              "You change your mind after coverage has been in use",
              "No refund; coverage runs to its expiry date",
            ],
            [
              "You close your account mid-term",
              "No refund for the unused portion",
            ],
            [
              "Coverage is cancelled because of a serious breach of our Terms or Acceptable Use Policy",
              "No refund",
            ],
            [
              "The payment was reversed, charged back or fraudulent",
              "No refund due; coverage is cancelled and the property archived",
            ],
          ],
        },
        {
          kind: "paragraph",
          text: `To request a refund, email ${LEGAL_ENTITY.supportEmail} with “Refund request” in the subject line, quoting your receipt number or transaction reference and explaining the reason. We will respond within five business days.`,
        },
        {
          kind: "paragraph",
          text: "Approved refunds are returned to the original payment method through our payment processor. Depending on your bank, funds typically take 5 to 10 business days to appear. We refund the NGN amount charged; we are not responsible for exchange rate movements or bank fees applied to your account.",
        },
        {
          kind: "paragraph",
          text: "Nothing in this section limits any non-excludable right you have under the Federal Competition and Consumer Protection Act or other applicable consumer law.",
        },
      ],
    },
    {
      id: "failed-payments",
      heading: "8. Failed and pending payments",
      blocks: [
        {
          kind: "paragraph",
          text: "If a payment fails, no coverage is created and you are not charged. You can retry from the dashboard.",
        },
        {
          kind: "paragraph",
          text: "If a payment is pending verification, the checkout session stays open until it is confirmed or expires. If your bank confirms a debit but your record has not updated within one hour, contact us with the transaction reference — we log every payment event and can reconcile it.",
        },
      ],
    },
    {
      id: "chargebacks",
      heading: "9. Chargebacks",
      blocks: [
        {
          kind: "paragraph",
          text: `Please contact us before raising a chargeback. Most disputes are a reconciliation problem we can fix within a day, and a chargeback is slower for you than an email to ${LEGAL_ENTITY.supportEmail}.`,
        },
        {
          kind: "paragraph",
          text: "Where a chargeback is raised, we may cancel the related coverage, archive the property and suspend the account pending resolution. We will supply the payment processor with our payment logs, receipts and account records in response. Raising a chargeback for a payment you know to be genuine breaches our Acceptable Use Policy.",
        },
      ],
    },
    {
      id: "price-changes",
      heading: "10. Price changes and taxes",
      blocks: [
        {
          kind: "paragraph",
          text: "We may change our prices. A change never affects coverage you have already paid for — it applies from your next purchase or renewal. We will publish updated prices in the dashboard and on our pricing page before they take effect.",
        },
        {
          kind: "paragraph",
          text: "Prices are inclusive of Nigerian Value Added Tax where it applies. If you need a tax invoice showing a specific business name or tax identification number, contact us with your receipt number.",
        },
      ],
    },
    {
      id: "contact",
      heading: "11. Billing support",
      blocks: [
        {
          kind: "paragraph",
          text: `For any billing question — a payment that did not land, a receipt you need, a refund, or a plan you are unsure about — email ${LEGAL_ENTITY.supportEmail}. Include your receipt number or transaction reference so we can find the payment quickly.`,
        },
      ],
    },
  ],
};
