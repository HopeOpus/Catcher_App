import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_ENTITY,
  LEGAL_LAST_UPDATED,
  LEGAL_VERSION,
} from "@/lib/legal/entity";
import { LEGAL_FACTS } from "@/lib/legal/facts";
import type { LegalDocument } from "@/lib/legal/types";

export const walletPolicy: LegalDocument = {
  slug: "wallet-referrals",
  title: "Wallet & Referral Rewards Policy",
  shortTitle: "Wallet & Referrals",
  summary:
    "How Catcher Security Credits are earned, spent, transferred and expired — and the rules governing the referral programme.",
  intro:
    "Catcher Security Credits are a promotional balance you can earn by referring other users and spend on Catcher coverage. This policy explains what credits are, what they are not, how the referral programme qualifies a referral, and the limits that apply to transfers.",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  lastUpdated: LEGAL_LAST_UPDATED,
  version: LEGAL_VERSION,
  sections: [
    {
      id: "what-credits-are",
      heading: "1. What Catcher Security Credits are",
      blocks: [
        {
          kind: "paragraph",
          text: `Catcher Security Credits ("credits") are a promotional balance held in your Catcher Wallet. One credit has a redemption value of ${LEGAL_FACTS.walletCreditValueLabel} when applied against the cost of Catcher coverage.`,
        },
        {
          kind: "callout",
          tone: "critical",
          title: "Credits are not money",
          text: "Credits are not legal tender, not electronic money, not a deposit, not a security, and not a cryptocurrency. They have no cash value outside Catcher. They cannot be withdrawn, exchanged for cash, converted to any currency, sold, traded on any external platform, or claimed as a debt owed to you. They are a promotional feature we may modify or discontinue.",
        },
        {
          kind: "paragraph",
          text: "You do not buy credits. They are issued by Catcher as a reward, a promotional grant, or an administrative adjustment, and they remain subject to this policy for as long as they sit in your wallet.",
        },
      ],
    },
    {
      id: "earning",
      heading: "2. How credits are earned",
      blocks: [
        {
          kind: "paragraph",
          text: "Credits reach your wallet in one of three ways:",
        },
        {
          kind: "list",
          items: [
            "referral milestone rewards, when enough of your referrals qualify;",
            "transfers received from another Catcher user; and",
            "promotional or administrative grants made by Catcher, including goodwill adjustments made by our support team.",
          ],
        },
      ],
    },
    {
      id: "referral-programme",
      heading: "3. The referral programme",
      blocks: [
        {
          kind: "paragraph",
          text: "Every account is issued a unique referral code and a shareable link. When someone signs up through your code and then qualifies, your referral count increases and you earn credits at each milestone.",
        },
        {
          kind: "table",
          caption: "Referral milestones",
          columns: ["Qualified referrals", "Reward", "Badge"],
          rows: LEGAL_FACTS.referralMilestones.map((milestone) => [
            String(milestone.target),
            `${milestone.rewardCredits} credits`,
            milestone.badge ?? "—",
          ]),
        },
        {
          kind: "paragraph",
          text: "Milestone rewards are awarded once each. Passing a milestone a second time does not award it again.",
        },
        {
          kind: "callout",
          tone: "warning",
          title: "A referral only qualifies on a paid plan",
          text: "A referred user must complete a paid coverage checkout for the referral to qualify. Sign-ups that stop at the free plan do not qualify and never count toward a milestone, no matter how many there are.",
        },
      ],
    },
    {
      id: "referral-integrity",
      heading: "4. Referral integrity",
      blocks: [
        {
          kind: "paragraph",
          text: "The programme exists to reward genuine word-of-mouth. Our systems automatically block or flag referral attachments where:",
        },
        {
          kind: "list",
          items: [
            "you attempt to use your own referral code;",
            "the referred account shares an email address with the referring account;",
            "the referred account shares a phone number with the referring account; or",
            "the referred account is created from the same device installation as the referring account.",
          ],
        },
        {
          kind: "paragraph",
          text: "A blocked attachment earns nothing. A flagged attachment is held for review and may be reversed. Beyond these automatic checks, we may investigate any referral pattern that looks artificial.",
        },
        {
          kind: "paragraph",
          text: "Creating accounts to refer yourself, coordinating rings of accounts, paying people to sign up without genuine intent to use Catcher, or using bots to generate sign-ups are all serious breaches of our Acceptable Use Policy. We may reverse the credits, remove the badge, forfeit the balance and close the accounts involved.",
        },
      ],
    },
    {
      id: "spending",
      heading: "5. Spending credits",
      blocks: [
        {
          kind: "paragraph",
          text: "Credits can be applied to Catcher services, including registering property and renewing coverage. They cannot be applied to anything outside Catcher.",
        },
        {
          kind: "paragraph",
          text: "Credits are spent oldest-expiry-first, so the balance closest to expiring is always consumed before the rest. Each spend is recorded in your wallet transaction history.",
        },
        {
          kind: "paragraph",
          text: "If a payment or coverage funded by credits is later refunded or reversed, the credits are returned to your wallet on their original expiry terms. A refund does not extend the life of a credit.",
        },
      ],
    },
    {
      id: "transfers",
      heading: "6. Transferring credits",
      blocks: [
        {
          kind: "paragraph",
          text: "You can send credits to other Catcher users — the feature exists so you can cover registrations for family, staff or friends.",
        },
        {
          kind: "table",
          columns: ["Limit", "Value"],
          rows: [
            [
              "Minimum per transfer",
              `${LEGAL_FACTS.walletTransferMinCredits} credit`,
            ],
            [
              "Maximum per transfer",
              `${LEGAL_FACTS.walletTransferMaxCredits} credits`,
            ],
            [
              "Maximum sent per day",
              `${LEGAL_FACTS.walletTransferDailyLimitCredits} credits`,
            ],
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          title: "Transfers are final",
          text: "Check the recipient carefully before sending. A completed transfer cannot be reversed by you, and we will only intervene where there is clear evidence of fraud or a system error. Transferred credits keep their original expiry date — sending a credit does not reset its clock.",
        },
        {
          kind: "paragraph",
          text: "You must not sell credits, offer them for sale, exchange them for goods, services or cash outside Catcher, or use transfers to move value between unrelated parties. Doing so breaches this policy and our Acceptable Use Policy.",
        },
      ],
    },
    {
      id: "expiry",
      heading: "7. Expiry",
      blocks: [
        {
          kind: "paragraph",
          text: `Each credit expires ${LEGAL_FACTS.walletCreditExpiryLabel}. Expiry is applied per grant, not to your balance as a whole, so different parts of your balance can expire on different dates.`,
        },
        {
          kind: "paragraph",
          text: `We notify you when part of your balance is due to expire within ${LEGAL_FACTS.walletExpiryWarningDays} days. Expired credits are removed automatically and recorded in your transaction history. They cannot be reinstated, and no compensation is due for credits you did not use in time.`,
        },
      ],
    },
    {
      id: "wallet-management",
      heading: "8. Your wallet",
      blocks: [
        {
          kind: "paragraph",
          text: "Your wallet shows your current balance, your transaction history, your referral earnings and the transfer controls. The transaction history is the authoritative record of your balance.",
        },
        {
          kind: "paragraph",
          text: "If you believe your balance is wrong, contact us within 30 days of the transaction with the details. We will review the wallet ledger and correct any genuine error.",
        },
        {
          kind: "paragraph",
          text: "Wallets are personal to the account holder. You may not pool, share or operate a wallet on behalf of others as a service.",
        },
      ],
    },
    {
      id: "changes-and-forfeiture",
      heading: "9. Changes, suspension and forfeiture",
      blocks: [
        {
          kind: "paragraph",
          text: "Because credits are promotional, we may change milestone thresholds, reward amounts, redemption value, transfer limits or expiry terms, and we may suspend or end the programme entirely. Where a change materially reduces the value of credits you already hold, we will give you reasonable notice and a fair opportunity to spend them.",
        },
        {
          kind: "paragraph",
          text: "Credits are forfeited without compensation if your account is closed for a serious breach of our Terms of Service or Acceptable Use Policy, or if they were obtained through referral abuse, fraud or error.",
        },
        {
          kind: "paragraph",
          text: "If you close your account voluntarily, any remaining credits are forfeited. Spend them first.",
        },
      ],
    },
    {
      id: "tax",
      heading: "10. Tax",
      blocks: [
        {
          kind: "paragraph",
          text: "You are responsible for determining whether any reward you receive creates a tax obligation for you, and for meeting it. Catcher does not provide tax advice.",
        },
      ],
    },
    {
      id: "contact",
      heading: "11. Contact",
      blocks: [
        {
          kind: "paragraph",
          text: `For questions about your wallet, a transfer, a referral that did not qualify, or a balance you believe is wrong, email ${LEGAL_ENTITY.supportEmail} with your account email and the relevant transaction details.`,
        },
      ],
    },
  ],
};
