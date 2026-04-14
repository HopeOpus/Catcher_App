import type { Metadata } from "next";
import { headers } from "next/headers";
import { Navigation } from "@/components/navigation";
import Footer from "@/components/footer";
import { isDatabaseConnectionError } from "@/lib/database-errors";
import { getPublicRegistrySearchResult } from "@/lib/public-registry-search";
import {
  parsePublicRegistrySearchParams,
  type PublicRegistryPageSearchParams,
} from "@/lib/public-registry";
import {
  consumeRateLimit,
  resolveRateLimitIdentifierFromHeaders,
} from "@/lib/rate-limit";
import { AlertTriangle } from 'lucide-react';
import { RegistryExplorer } from "./registry-explorer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Search Registry | Catcher",
  description:
    "Search Catcher's public registry to verify registered property records, owner details, and theft-report status.",
  alternates: {
    canonical: "/search-registry",
  },
  openGraph: {
    title: "Search Registry | Catcher",
    description:
      "Search Catcher's public registry to verify registered property records, owner details, and theft-report status.",
    url: "/search-registry",
    type: "website",
  },
};

export default async function SearchRegistryPage({
  searchParams,
}: {
  searchParams?: PublicRegistryPageSearchParams;
}) {
  const headerStore = await headers();
  const rateLimit = await consumeRateLimit({
    scope: "public:registry:list",
    identifier: resolveRateLimitIdentifierFromHeaders(headerStore, {
      fallback: "public-registry",
    }),
    limit: 120,
    windowMs: 5 * 60 * 1000,
    blockDurationMs: 5 * 60 * 1000,
    failOpenOnError: true,
  });

  if (!rateLimit.allowed) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navigation />
        <main className="flex-grow pb-16 pt-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-amber-200 bg-white px-6 py-16 text-center shadow-sm">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
              <h1 className="text-2xl font-semibold text-[#0F2651]">
                Too many lookup requests
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-slate-600">
                Please wait about {rateLimit.retryAfterSeconds} seconds before checking the
                public property registry again.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const state = parsePublicRegistrySearchParams(resolvedSearchParams);
  const hasSearched = state.q.length > 0;
  let result = null;
  let isRegistryUnavailable = false;

  if (hasSearched) {
    try {
      result = await getPublicRegistrySearchResult(state);
    } catch (error) {
      if (isDatabaseConnectionError(error)) {
        console.error("Public registry database connection error:", error);
        isRegistryUnavailable = true;
      } else {
        throw error;
      }
    }
  } else {
    result = {
      items: [],
      totalCount: 0,
      totalPages: 0,
      page: 1,
      pageSize: state.pageSize,
      rangeStart: 0,
      rangeEnd: 0,
      state,
    };
  }

  if (isRegistryUnavailable || !result) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navigation />

        <main className="flex-grow pb-16 pt-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h1 className="mb-4 text-4xl font-bold text-[#0F2651] md:text-5xl">
                Search <span className="text-[#36689e]">Registry</span>
              </h1>
              <p className="mx-auto max-w-3xl text-xl text-slate-600">
                Search Catcher&apos;s public property registry to verify ownership details,
                contact the registrant, and quickly see whether a property has been reported stolen.
              </p>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-white px-6 py-16 text-center shadow-sm">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
              <h2 className="text-2xl font-semibold text-[#0F2651]">
                Registry temporarily unavailable
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-600">
                We could not connect to the registry database just now. Please try again in a
                moment.
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navigation />

      <main className="flex-grow pb-16 pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-[#0F2651] md:text-5xl">
              Search <span className="text-[#36689e]">Registry</span>
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-slate-600">
              Search Catcher&apos;s public property registry to verify ownership details,
              contact the registrant, and quickly see whether a property has been reported stolen.
            </p>
          </div>

          <RegistryExplorer result={result} hasSearched={hasSearched} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
