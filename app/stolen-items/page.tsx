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
import { MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const dynamic = "force-dynamic";

interface StolenItem {
  id: string;
  property_name: string;
  serial_number: string;
  date_reported: string;
  location: string;
  description: string;
  status: string;
}

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

  const items = await getStolenItems();

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
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item: StolenItem) => (
                <div key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex-grow p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="rounded-xl bg-red-50 p-3 text-red-600">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <Badge className="border-none bg-red-100 text-red-800">
                        {item.status || 'Reported Stolen'}
                      </Badge>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-[#0F2651]">{item.property_name}</h3>
                    <div className="mb-4 space-y-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-1 font-medium text-slate-700">SN: {item.serial_number}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                        <span>{item.location || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{new Date(item.date_reported).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="line-clamp-3 text-sm text-slate-600">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-auto border-t border-slate-100 bg-slate-50 px-6 py-4">
                    <Link
                      href={`/stolen-items/${item.id}`}
                      className="block w-full text-center text-sm font-medium text-[#36689e] transition-colors hover:text-[#0F2651]"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
