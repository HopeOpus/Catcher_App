import { headers } from "next/headers";
import { Navigation } from "@/components/navigation";
import Footer from "@/components/footer";
import { getStolenReportStatusLabel } from "@/lib/catcher-domain";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import { prisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  resolveRateLimitIdentifierFromHeaders,
} from "@/lib/rate-limit";
import { AlertTriangle } from 'lucide-react';
import { StolenItemsExplorer, type PublicStolenItem } from "./stolen-items-explorer";

export const dynamic = "force-dynamic";

async function getStolenItems() {
  try {
    await syncPropertyLifecycle(prisma);

    const reports = await prisma.stolenReport.findMany({
      where: {
        property: {
          archivedAt: null,
        },
      },
      orderBy: { dateReported: "desc" },
    });

    return reports.map((report: (typeof reports)[number]) => ({
      id: report.id,
      property_name: report.propertyName,
      serial_number: report.serialNumber,
      date_reported: report.dateReported.toISOString(),
      location: report.location ?? "",
      description: report.description ?? "",
      status: getStolenReportStatusLabel(report.status),
    }));
  } catch (error) {
    console.error('Error fetching stolen items:', error);
    return [];
  }
}

export default async function StolenItemsPage() {
  const headerStore = await headers();
  const rateLimit = await consumeRateLimit({
    scope: "public:stolen-items:list",
    identifier: resolveRateLimitIdentifierFromHeaders(headerStore, {
      fallback: "public-stolen-items",
    }),
    limit: 120,
    windowMs: 5 * 60 * 1000,
    blockDurationMs: 5 * 60 * 1000,
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
                public stolen-items database again.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const items = (await getStolenItems()) as PublicStolenItem[];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navigation />

      <main className="flex-grow pb-16 pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-[#0F2651] md:text-5xl">
              Stolen Items <span className="text-[#36689e]">Database</span>
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-slate-600">
              Check our public database of reported stolen items to avoid purchasing stolen property.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <h2 className="text-2xl font-semibold text-[#0F2651]">No reported stolen items yet</h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-600">
                Public stolen-property records will appear here once verified reports are submitted.
              </p>
            </div>
          ) : <StolenItemsExplorer items={items} />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
