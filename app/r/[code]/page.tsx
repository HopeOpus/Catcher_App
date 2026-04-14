"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const DEFAULT_MOBILE_REFERRAL_DEEP_LINK_BASE =
  process.env.NEXT_PUBLIC_MOBILE_REFERRAL_DEEP_LINK_BASE?.trim() ||
  "catcherapp://auth/register";
const APP_DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_MOBILE_APP_DOWNLOAD_URL?.trim() || "";

function normalizeReferralCode(value: string | string[] | undefined) {
  const resolved = Array.isArray(value) ? value[0] : value;
  if (!resolved) {
    return null;
  }

  const normalized = resolved.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  return normalized.length > 0 ? normalized : null;
}

export default function ReferralLandingPage() {
  const params = useParams<{ code: string }>();
  const [showFallback, setShowFallback] = useState(false);
  const referralCode = normalizeReferralCode(params?.code);
  const shouldShowFallback = showFallback || !referralCode;

  const deepLink = useMemo(() => {
    if (!referralCode) {
      return DEFAULT_MOBILE_REFERRAL_DEEP_LINK_BASE;
    }

    const separator = DEFAULT_MOBILE_REFERRAL_DEEP_LINK_BASE.includes("?") ? "&" : "?";
    return `${DEFAULT_MOBILE_REFERRAL_DEEP_LINK_BASE}${separator}ref=${encodeURIComponent(referralCode)}`;
  }, [referralCode]);

  useEffect(() => {
    if (!referralCode) {
      return;
    }

    window.location.replace(deepLink);
    const timeout = window.setTimeout(() => setShowFallback(true), 1400);
    return () => window.clearTimeout(timeout);
  }, [deepLink, referralCode]);

  const continueOnWebHref = referralCode
    ? `/auth/signup?ref=${encodeURIComponent(referralCode)}`
    : "/auth/signup";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#ffffff_55%,_#e2e8f0)] px-6 py-16 text-slate-900">
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-slate-200/70 bg-white/90 p-8 text-center shadow-xl shadow-slate-200/60 backdrop-blur">
        <div className="mb-4 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          Catcher Referral
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {shouldShowFallback ? "Open Catcher or continue on the web" : "Opening Catcher..."}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
          {referralCode
            ? `Referral code ${referralCode} is ready. If the app does not open automatically, choose one of the options below.`
            : "This referral link looks incomplete. You can still continue to sign up on the web."}
        </p>

        {referralCode ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Your referral will be carried into signup and attached during onboarding.
          </div>
        ) : null}

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={deepLink}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open in App
          </a>
          <Link
            href={continueOnWebHref}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Continue on Web
          </Link>
          {APP_DOWNLOAD_URL ? (
            <a
              href={APP_DOWNLOAD_URL}
              className="inline-flex items-center justify-center rounded-2xl border border-sky-300 px-5 py-3 text-sm font-semibold text-sky-700 transition hover:border-sky-400 hover:bg-sky-50"
            >
              Get the App
            </a>
          ) : null}
        </div>
      </div>
    </main>
  );
}
