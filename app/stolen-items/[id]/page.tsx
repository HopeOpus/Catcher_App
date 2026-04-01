import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Calendar, MapPin, ArrowLeft, AlertTriangle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import { prisma } from "@/lib/prisma";
import { getStolenReportStatusLabel, normalizeStoredPhotoUrl } from "@/lib/catcher-domain";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import {
  consumeRateLimit,
  resolveRateLimitIdentifierFromHeaders,
} from "@/lib/rate-limit";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export default async function StolenItemDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const headerStore = await headers();
  const rateLimit = await consumeRateLimit({
    scope: "public:stolen-items:detail",
    identifier: resolveRateLimitIdentifierFromHeaders(headerStore, {
      fallback: "public-stolen-item-detail",
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
                Please wait about {rateLimit.retryAfterSeconds} seconds before opening another
                public stolen-item record.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { id } = await params;
  await syncPropertyLifecycle(prisma);

  const report = await prisma.stolenReport.findFirst({
    where: {
      id,
      property: {
        archivedAt: null,
      },
    },
    include: {
      property: {
        include: {
          photos: {
            orderBy: { uploadedAt: "asc" },
          },
        },
      },
    },
  });

  if (!report) {
    notFound();
  }

  const propertyPhotos = report.property.photos.map((photo) =>
    normalizeStoredPhotoUrl(photo.fileUrl),
  );
  const evidenceUrls = report.evidenceUrls.map(normalizeStoredPhotoUrl);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navigation />

      <main className="flex-grow pb-16 pt-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/stolen-items"
              className="inline-flex items-center text-sm font-medium text-[#36689e] transition-colors hover:text-[#0F2651]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to stolen items
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.85fr)]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-4 inline-flex rounded-2xl bg-red-50 p-3 text-red-600">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl font-bold text-[#0F2651]">
                      {report.propertyName}
                    </h1>
                    <p className="mt-2 break-all text-sm text-slate-600">
                      Serial Number: {report.serialNumber}
                    </p>
                  </div>
                  <Badge className="w-fit border-none bg-red-100 text-red-800">
                    {getStolenReportStatusLabel(report.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reported Date
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm text-[#0F2651]">
                      <Calendar className="h-4 w-4 text-[#36689e]" />
                      {formatDate(report.dateReported)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Location
                    </p>
                    <p className="mt-2 inline-flex items-start gap-2 text-sm text-[#0F2651]">
                      <MapPin className="mt-0.5 h-4 w-4 text-[#36689e]" />
                      <span>{report.location || "Location not specified"}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 px-5 py-5">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Incident Description
                  </h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {report.description || "No additional description was provided."}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-semibold text-[#0F2651]">Evidence Files</h2>
                {evidenceUrls.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {evidenceUrls.map((url, index) => (
                      <a
                        key={`${url}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-[#36689e] transition-colors hover:bg-slate-50 hover:text-[#0F2651]"
                      >
                        <FileText className="h-4 w-4" />
                        Evidence {index + 1}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">
                    No evidence files were attached to this report.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-semibold text-[#0F2651]">Property Photos</h2>
                {propertyPhotos.length > 0 ? (
                  <div className="mt-5 grid grid-cols-1 gap-4">
                    {propertyPhotos.map((url, index) => (
                      <a
                        key={`${url}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`${report.propertyName} ${index + 1}`}
                          className="h-56 w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">
                    No property photos are available for this record.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
