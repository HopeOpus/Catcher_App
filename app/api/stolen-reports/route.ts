import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  DEFAULT_STOLEN_REPORT_STATUS,
  getStolenReportStatusLabel,
  isStolenReportStatus,
} from "@/lib/catcher-domain";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import {
  canInScope,
  lifecycleFilter,
  ownershipWhere,
  resolveAccountScope,
} from "@/lib/account-scope";
import { prisma } from "@/lib/prisma";

type StolenReportRecord = {
  id: string;
  userId: string;
  propertyId: string;
  propertyName: string;
  serialNumber: string;
  dateReported: Date;
  location: string;
  description: string | null;
  status: string;
  evidenceUrls: string[];
  createdAt: Date;
  updatedAt: Date;
};

function serializeStolenReport(report: StolenReportRecord) {
  return {
    id: report.id,
    user_id: report.userId,
    property_id: report.propertyId,
    property_name: report.propertyName,
    serial_number: report.serialNumber,
    date_reported: report.dateReported,
    location: report.location,
    description: report.description,
    status: report.status,
    status_label: getStolenReportStatusLabel(report.status),
    evidence_urls: report.evidenceUrls,
    created_at: report.createdAt,
    updated_at: report.updatedAt,
  };
}

export async function GET(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

    const scope = await resolveAccountScope(authenticatedUser);
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    await syncPropertyLifecycle(prisma, {
      ...lifecycleFilter(scope),
      propertyId: propertyId ?? undefined,
    });

    const reports = await prisma.stolenReport.findMany({
      where: {
        ...ownershipWhere(scope),
        property: {
          archivedAt: null,
        },
        ...(propertyId ? { propertyId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reports.map(serializeStolenReport));
  } catch (error) {
    console.error("Error fetching stolen reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch stolen reports" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const propertyId = body.property_id;
    const location =
      typeof body.location === "string" ? body.location.trim() : "";
    const description =
      typeof body.description === "string" && body.description.trim().length > 0
        ? body.description.trim()
        : null;
    const evidenceUrls = Array.isArray(body.evidence_urls)
      ? body.evidence_urls.filter(
          (value: unknown): value is string =>
            typeof value === "string" && value.trim().length > 0,
        )
      : [];

    if (typeof propertyId !== "string" || propertyId.trim().length === 0) {
      return NextResponse.json(
        { error: "property_id is required" },
        { status: 400 },
      );
    }

    if (!location) {
      return NextResponse.json(
        { error: "location is required" },
        { status: 400 },
      );
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

    const scope = await resolveAccountScope(authenticatedUser, request);

    if (!canInScope(scope, "reportStolen")) {
      return NextResponse.json(
        { error: "Your role in this business cannot file stolen reports." },
        { status: 403 },
      );
    }

    await syncPropertyLifecycle(prisma, {
      ...lifecycleFilter(scope),
      propertyId,
    });

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ...ownershipWhere(scope),
        archivedAt: null,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found or is no longer active for the current user" },
        { status: 404 },
      );
    }

    const finalStatus = isStolenReportStatus(body.status)
      ? body.status
      : DEFAULT_STOLEN_REPORT_STATUS;

    const createReport = prisma.stolenReport.create({
      data: {
        id: randomUUID(),
        userId: authenticatedUser.userId,
        businessId: property.businessId,
        propertyId: property.id,
        propertyName: property.name,
        serialNumber: property.serialNumber,
        dateReported: body.date_reported
          ? new Date(body.date_reported)
          : new Date(),
        location,
        description,
        status: finalStatus,
        evidenceUrls,
      },
    });

    const updateProperty = prisma.property.update({
      where: { id: property.id },
      data: { status: "Stolen" },
    });

    const [report] = await prisma.$transaction([createReport, updateProperty]);

    return NextResponse.json(serializeStolenReport(report), { status: 201 });
  } catch (error) {
    console.error("Error creating stolen report:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create stolen report";

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Failed to create stolen report"
            : errorMessage,
      },
      { status: 500 },
    );
  }
}
