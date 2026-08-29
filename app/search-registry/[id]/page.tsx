/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import Footer from "@/components/footer";
import { isDatabaseConnectionError } from "@/lib/database-errors";
import {
  getStolenReportStatusLabel,
  normalizeStoredPhotoUrl,
} from "@/lib/catcher-domain";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import { prisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  resolveRateLimitIdentifierFromHeaders,
} from "@/lib/rate-limit";
import { buildPropertyVerificationPath } from "@/lib/property-public-verification";
import {
  buildPublicRegistryHref,
  parsePublicRegistrySearchParams,
  type PublicRegistryPageSearchParams,
} from "@/lib/public-registry";

function formatDate(value: Date | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

function getOwnerInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "CU";
}

function getPropertyStatusClasses(status: string) {
  switch (status) {
    case "Stolen":
      return "bg-red-100 text-red-800";
    case "Flagged":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-green-100 text-green-800";
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const property = await prisma.property.findFirst({
      where: {
        id,
        archivedAt: null,
      },
      select: {
        name: true,
        type: true,
        serialNumber: true,
      },
    });

    if (!property) {
      return {
        title: "Registry Record | Catcher",
      };
    }

    return {
      title: `${property.name} | Search Registry | Catcher`,
      description: `View the public Catcher registry record for ${property.name}, a ${property.type.toLowerCase()} item with serial number ${property.serialNumber}.`,
      alternates: {
        canonical: `/search-registry/${id}`,
      },
      openGraph: {
        title: `${property.name} | Search Registry | Catcher`,
        description: `View the public Catcher registry record for ${property.name}.`,
        url: `/search-registry/${id}`,
        type: "article",
      },
    };
  } catch {
    return {
      title: "Registry Record | Catcher",
    };
  }
}

export default async function RegistryPropertyDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: PublicRegistryPageSearchParams;
}) {
  const headerStore = await headers();
  const rateLimit = await consumeRateLimit({
    scope: "public:registry:detail",
    identifier: resolveRateLimitIdentifierFromHeaders(headerStore, {
      fallback: "public-registry-detail",
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
                Please wait about {rateLimit.retryAfterSeconds} seconds before opening another
                public registry record.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const registryState = parsePublicRegistrySearchParams(resolvedSearchParams);
  const backToRegistryHref = buildPublicRegistryHref(registryState);
  const { userId } = await auth();
  const canViewOwnerContact = Boolean(userId);

  let property = null;

  try {
    await syncPropertyLifecycle(prisma, {
      propertyId: id,
    });

    property = await prisma.property.findFirst({
      where: {
        id,
        archivedAt: null,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
            profileImageUrl: true,
          },
        },
        photos: {
          orderBy: { uploadedAt: "asc" },
        },
        stolenReports: {
          orderBy: [{ dateReported: "desc" }, { createdAt: "desc" }],
        },
        publicVerification: {
          select: {
            slug: true,
          },
        },
      },
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      console.error("Public registry detail database connection error:", error);

      return (
        <div className="flex min-h-screen flex-col bg-slate-50">
          <Navigation />

          <main className="flex-grow pb-16 pt-24">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <Link
                  href={backToRegistryHref}
                  className="inline-flex items-center text-sm font-medium text-[#36689e] transition-colors hover:text-[#0F2651]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Search Registry
                </Link>
              </div>

              <div className="rounded-3xl border border-amber-200 bg-white px-6 py-16 text-center shadow-sm">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
                <h1 className="text-2xl font-semibold text-[#0F2651]">
                  Registry record temporarily unavailable
                </h1>
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

    throw error;
  }

  if (!property) {
    notFound();
  }

  const propertyPhotos = [
    property.photoUrl ? normalizeStoredPhotoUrl(property.photoUrl) : null,
    ...property.photos.map((photo) => normalizeStoredPhotoUrl(photo.fileUrl)),
  ].filter((url, index, collection): url is string => Boolean(url) && collection.indexOf(url) === index);
  const ownerImageUrl = property.user.profileImageUrl
    ? normalizeStoredPhotoUrl(property.user.profileImageUrl)
    : null;
  const latestReport = property.stolenReports[0] ?? null;
  const isReportedStolen = property.stolenReports.length > 0;
  const verificationPath = property.publicVerification
    ? buildPropertyVerificationPath(property.publicVerification.slug)
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navigation />

      <main className="flex-grow pb-16 pt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href={backToRegistryHref}
              className="inline-flex items-center text-sm font-medium text-[#36689e] transition-colors hover:text-[#0F2651]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search Registry
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="space-y-8">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getPropertyStatusClasses(property.status)}>
                        {property.status}
                      </Badge>
                      <Badge
                        className={
                          isReportedStolen
                            ? "border-none bg-red-100 text-red-800"
                            : "border-none bg-green-100 text-green-800"
                        }
                      >
                        {isReportedStolen ? "Reported Stolen" : "Not Reported Stolen"}
                      </Badge>
                    </div>
                    <h1 className="mt-4 text-3xl font-bold text-[#0F2651]">
                      {property.name}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                      {property.type} · Serial Number{" "}
                      <span className="font-medium text-[#0F2651]">
                        {property.serialNumber}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p className="font-semibold text-[#0F2651]">Registered on Catcher</p>
                    <p className="mt-1">{formatDate(property.dateRegistered)}</p>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Registry Status
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#0F2651]">{property.status}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Theft Report Status
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#0F2651]">
                      {isReportedStolen
                        ? latestReport
                          ? getStolenReportStatusLabel(latestReport.status)
                          : "Reported Stolen"
                        : "No report on file"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Total Theft Reports
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#0F2651]">
                      {property.stolenReports.length}
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-slate-200 px-5 py-5">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Property Description
                  </h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {property.description || "No additional property description was provided."}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-semibold text-[#0F2651]">Registrant Details</h2>
                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
                  {ownerImageUrl ? (
                    <img
                      src={ownerImageUrl}
                      alt={property.user.name}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#36689e]/10 text-lg font-semibold text-[#0F2651]">
                      {getOwnerInitials(property.user.name)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Registrant Name
                      </p>
                      <p className="mt-1 text-xl font-semibold text-[#0F2651]">
                        {property.user.name}
                      </p>
                    </div>
                    {canViewOwnerContact ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <a
                          href={`mailto:${property.user.email}`}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition-colors hover:bg-white"
                        >
                          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <Mail className="h-4 w-4 text-[#36689e]" />
                            Email
                          </span>
                          <p className="mt-2 break-all text-sm font-medium text-[#0F2651]">
                            {property.user.email}
                          </p>
                        </a>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <Phone className="h-4 w-4 text-[#36689e]" />
                            Phone
                          </span>
                          <p className="mt-2 text-sm font-medium text-[#0F2651]">
                            {property.user.phoneNumber ? (
                              <a href={`tel:${property.user.phoneNumber}`}>
                                {property.user.phoneNumber}
                              </a>
                            ) : (
                              "Phone number not available"
                            )}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <Lock className="h-4 w-4 text-[#36689e]" />
                          Contact details hidden
                        </span>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          Catcher shows registrant email and phone number to signed-in
                          users only, so the public registry cannot be used to harvest
                          contact data.
                        </p>
                        <Link
                          href="/auth/signin"
                          className="mt-3 inline-block text-sm font-semibold text-[#36689e] transition-colors hover:text-[#0F2651]"
                        >
                          Sign in to contact the registrant
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-semibold text-[#0F2651]">Theft Report History</h2>
                {property.stolenReports.length > 0 ? (
                  <div className="mt-5 space-y-4">
                    {property.stolenReports.map((report) => (
                      <div
                        key={report.id}
                        className="rounded-2xl border border-red-200 bg-red-50 px-5 py-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="border-none bg-red-100 text-red-800">
                                Reported Stolen
                              </Badge>
                              <Badge className="border-none bg-white text-red-700">
                                {getStolenReportStatusLabel(report.status)}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-red-700">
                              <span className="inline-flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {formatDate(report.dateReported)}
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {report.location || "Location not specified"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-red-800">
                          {report.description || "No theft description was provided for this report."}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-5">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-green-600" />
                      <div>
                        <h3 className="font-semibold text-green-800">No theft report on file</h3>
                        <p className="mt-1 text-sm leading-7 text-green-700">
                          This registry record is publicly searchable, but it does not currently
                          have a stolen-property report attached.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
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
                        <img
                          src={url}
                          alt={`${property.name} ${index + 1}`}
                          className="h-64 w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                    No property photos are available for this record.
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F2651]">
                      {verificationPath
                        ? "Public verification available"
                        : "Public verification not generated yet"}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {verificationPath
                        ? "This property also has a Catcher verification page you can share or scan for quick registry confirmation."
                        : "This registry record is public and searchable, but a separate verification page has not been generated for it yet."}
                    </p>
                  </div>
                </div>
                {verificationPath ? (
                  <div className="mt-5 flex flex-col gap-3">
                    <Button asChild className="bg-[#36689e] text-white hover:bg-[#0F2651]">
                      <Link href={verificationPath}>
                        <ShieldCheck className="h-4 w-4" />
                        Open Verification Page
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-[#36689e] text-[#0F2651]">
                      <Link href={`${verificationPath}/qr`} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Open Verification QR
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
