/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import Footer from "@/components/footer";
import {
  normalizeStoredPhotoUrl,
  PROPERTY_PLAN_LABELS,
} from "@/lib/catcher-domain";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import { prisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  resolveRateLimitIdentifierFromHeaders,
} from "@/lib/rate-limit";
import { buildPropertyVerificationUrl } from "@/lib/property-public-verification";
import { AlertTriangle, CheckCircle2, Download, ExternalLink, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) {
    return "No expiry";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

function getStatusTone(status: string) {
  switch (status) {
    case "Stolen":
      return "bg-red-100 text-red-800";
    case "Flagged":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-green-100 text-green-800";
  }
}

export default async function PropertyVerificationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const headerStore = await headers();
  const rateLimit = await consumeRateLimit({
    scope: "public:verify:page",
    identifier: resolveRateLimitIdentifierFromHeaders(headerStore, {
      fallback: "public-property-verification",
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
                Too many verification requests
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-slate-600">
                Please wait about {rateLimit.retryAfterSeconds} seconds before opening another
                public verification page.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { slug } = await params;

  const baseVerification = await prisma.propertyPublicVerification.findUnique({
    where: {
      slug,
    },
    select: {
      propertyId: true,
    },
  });

  if (!baseVerification) {
    notFound();
  }

  await syncPropertyLifecycle(prisma, {
    propertyId: baseVerification.propertyId,
  });

  const verification = await prisma.propertyPublicVerification.findFirst({
    where: {
      slug,
      isActive: true,
      property: {
        archivedAt: null,
      },
    },
    include: {
      property: {
        include: {
          photos: {
            orderBy: { uploadedAt: "asc" },
            take: 1,
          },
          coverages: {
            where: {
              status: {
                in: ["active", "grace", "scheduled"],
              },
            },
            orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
            take: 1,
          },
        },
      },
    },
  });

  if (!verification) {
    notFound();
  }

  const propertyPhoto =
    verification.property.photoUrl ||
    verification.property.photos[0]?.fileUrl ||
    null;
  const normalizedPhotoUrl = propertyPhoto
    ? normalizeStoredPhotoUrl(propertyPhoto)
    : null;
  const currentCoverage = verification.property.coverages[0] ?? null;
  const verificationUrl = buildPropertyVerificationUrl(verification.slug);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navigation />

      <main className="flex-grow pb-16 pt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-800">
              <ShieldCheck className="h-4 w-4" />
              Verified on Catcher
            </div>
            <h1 className="text-4xl font-bold text-[#0F2651] md:text-5xl">
              Property Verification
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
              This public page confirms that the property below has an active Catcher
              registration record.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="space-y-8">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getStatusTone(verification.property.status)}>
                        {verification.property.status}
                      </Badge>
                      <Badge className="bg-slate-100 text-slate-700">
                        Verification Live
                      </Badge>
                    </div>
                    <h2 className="mt-4 text-3xl font-bold text-[#0F2651]">
                      {verification.property.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {verification.property.type} · Serial Number{" "}
                      <span className="font-medium text-[#0F2651]">
                        {verification.property.serialNumber}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    <p className="font-semibold">Verification ID</p>
                    <p className="mt-1 break-all">{verification.slug}</p>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Registered
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#0F2651]">
                      {formatDate(verification.property.dateRegistered)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Current Plan
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#0F2651]">
                      {currentCoverage
                        ? PROPERTY_PLAN_LABELS[currentCoverage.planCode]
                        : "No active plan"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Plan Status
                    </p>
                    <p className="mt-2 text-sm font-medium capitalize text-[#0F2651]">
                      {currentCoverage?.status ?? "Not available"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Coverage Until
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#0F2651]">
                      {currentCoverage?.expiresAt
                        ? formatDate(currentCoverage.expiresAt)
                        : "No expiry"}
                    </p>
                  </div>
                </div>

                {verification.property.description ? (
                  <div className="mt-8 rounded-2xl border border-slate-200 px-5 py-5">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Property Description
                    </h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {verification.property.description}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-[#0F2651]">Verification Guidance</h3>
                <div className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
                  <p>
                    This page confirms that the property is registered on Catcher and that the
                    public verification record is currently active.
                  </p>
                  <p>
                    The page intentionally does not expose the owner’s personal details. If you
                    need further validation, contact the Catcher support team with the verification
                    ID shown above.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-[#0F2651]">Share & Scan</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Share this verification URL directly or scan the QR code to open the same page.
                </p>

                <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <img
                    src={`/verify/${encodeURIComponent(verification.slug)}/qr`}
                    alt={`QR code for ${verification.property.name} verification`}
                    className="mx-auto h-64 w-64 rounded-2xl bg-white p-3 shadow-sm"
                  />
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Public Verification URL
                  </p>
                  <p className="mt-2 break-all text-sm text-[#0F2651]">{verificationUrl}</p>
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  <Button asChild className="bg-[#36689e] text-white hover:bg-[#0F2651]">
                    <a href={`/verify/${encodeURIComponent(verification.slug)}/qr`} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                      Open QR Code
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="border-[#36689e] text-[#0F2651]">
                    <a href={verificationUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Open Verification Link
                    </a>
                  </Button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-[#0F2651]">Property Photo</h3>
                {normalizedPhotoUrl ? (
                  <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <img
                      src={normalizedPhotoUrl}
                      alt={verification.property.name}
                      className="h-full max-h-[24rem] w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                    No public photo is available for this property record.
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F2651]">
                      Verification confirmed
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      This verification page is active and currently linked to a live property
                      record in Catcher.
                    </p>
                  </div>
                </div>
                <div className="mt-5">
                  <Link
                    href="/"
                    className="text-sm font-medium text-[#36689e] transition-colors hover:text-[#0F2651]"
                  >
                    Return to Catcher home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
