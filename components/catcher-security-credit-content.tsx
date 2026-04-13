"use client";

import Image from "next/image";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";

const referralTiers = [
  { referrals: 5, coins: 7, badge: "" },
  { referrals: 20, coins: 30, badge: "" },
  { referrals: 100, coins: 200, badge: '"Catcher Ambassador" badge' },
];

const coinsAllowed = [
  "Registering new items",
  "Premium features",
  "Theft alert boosting",
  "Transfers to other users",
];

const coinsNotAllowed = [
  "Cash withdrawal",
  "External trading",
  "Conversion to fiat",
];

export function CatcherSecurityCreditContent() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_0%,transparent_0%,var(--color-background)_75%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="sm:mx-auto lg:mr-auto lg:mt-0 text-center">
            <TextEffect
              preset="fade-in-blur"
              speedSegment={0.3}
              as="h1"
              className="text-5xl font-bold tracking-tight text-[#0F2651] md:text-6xl">
              Catcher Security Credit
            </TextEffect>
            <TextEffect
              per="line"
              preset="fade-in-blur"
              speedSegment={0.3}
              delay={0.5}
              as="p"
              className="mt-6 max-w-2xl mx-auto text-lg text-slate-600">
              Earn coins, protect your family, and build your network with Catcher Wallet.
            </TextEffect>
          </div>
        </div>
      </section>

      {/* Tiered Referrals Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#0F2651] md:text-4xl">
              Tiered Referrals
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Earn bonus coins as you grow your network
            </p>
          </div>

          <AnimatedGroup>
            <div className="flex flex-col md:flex-row justify-center gap-6 flex-wrap md:flex-nowrap">
              {referralTiers.map((tier) => (
                <div
                  key={tier.referrals}
                  className="flex-1 min-w-full md:min-w-0 rounded-2xl border-2 border-[#36689e]/20 bg-gradient-to-br from-[#f0f5fa] to-white p-8 text-center shadow-sm">
                <div className="mb-4">
                  <p className="text-5xl font-bold text-[#0F2651]">
                    {tier.referrals}
                  </p>
                  <p className="text-lg text-slate-600">Referrals</p>
                </div>
                <div className="my-6 border-t border-slate-200" />
                <div>
                  <p className="text-4xl font-bold text-[#36689e]">
                    +{tier.coins}
                  </p>
                  <p className="text-slate-600">Bonus Coins</p>
                  {tier.badge && (
                    <p className="mt-4 inline-block rounded-full bg-[#336699] text-white px-4 py-1 text-sm font-semibold">
                      {tier.badge}
                    </p>
                  )}
                </div>
                </div>
              ))}
            </div>
          </AnimatedGroup>
        </div>
      </section>

      {/* Protect Your Family Feature */}
      <section className="py-16 bg-[#f8fbff]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-[#0F2651] md:text-4xl">
                Protect Your Family
              </h2>
              <p className="mb-6 text-lg text-slate-600">
                Share your Catcher coins with friends and family members. They can use these coins to register their items and access premium features.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-6 w-6 rounded-full bg-[#36689e] flex-shrink-0" />
                  <p className="text-slate-700">Send coins to friends and family</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-6 w-6 rounded-full bg-[#36689e] flex-shrink-0" />
                  <p className="text-slate-700">They use it to register their items</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-6 w-6 rounded-full bg-[#36689e] flex-shrink-0" />
                  <p className="text-slate-700">Build a network of protected assets</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <Image
                src="/img1.jpg"
                alt="Protect Your Family"
                width={400}
                height={400}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Catcher Wallet Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#0F2651] md:text-4xl">
              Your Catcher Wallet
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Every user gets a Catcher Wallet to manage their coins
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm">
              <h3 className="mb-6 text-2xl font-bold text-[#0F2651]">
                Wallet Components
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <svg
                    className="h-5 w-5 text-[#36689e]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-slate-700">Coin balance</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    className="h-5 w-5 text-[#36689e]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-slate-700">Transaction history</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    className="h-5 w-5 text-[#36689e]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-slate-700">Referral earnings tracker</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg
                    className="h-5 w-5 text-[#36689e]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-slate-700">Gift/transfer button</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-center">
              <Image
                src="/img2.jpg"
                alt="Catcher Wallet"
                width={400}
                height={400}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Coins Rules Section */}
      <section className="py-16 bg-[#f8fbff]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#0F2651] md:text-4xl">
              How to Use Your Coins
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Coins can be used for specific Catcher features and services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Allowed */}
            <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-900">Allowed</h3>
              </div>
              <ul className="space-y-4">
                {coinsAllowed.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-green-900">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Not Allowed */}
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-red-900">Not Allowed</h3>
              </div>
              <ul className="space-y-4">
                {coinsNotAllowed.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span className="text-red-900">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* General Rules Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#0F2651] md:text-4xl">
              General Rules
            </h2>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border-l-4 border-l-[#36689e] bg-slate-50 p-8">
              <h3 className="mb-2 text-xl font-bold text-[#0F2651]">
                Coin Expiration
              </h3>
              <p className="text-slate-700">
                Coins expire after 12 months if they remain unused. Make sure to use your coins before they expire.
              </p>
            </div>

            <div className="rounded-2xl border-l-4 border-l-[#36689e] bg-slate-50 p-8">
              <h3 className="mb-2 text-xl font-bold text-[#0F2651]">
                Limited-Time Promotions
              </h3>
              <p className="text-slate-700">
                All promotional offers and bonus coins are time-limited. Take advantage of them while they`re available.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
