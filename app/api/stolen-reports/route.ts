import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  DEFAULT_STOLEN_REPORT_STATUS,
  getStolenReportStatusLabel,
  isStolenReportStatus,
} from "@/lib/catcher-domain";
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const propertyId = searchParams.get("propertyId");

    const reports = await prisma.stolenReport.findMany({
      where: {
        ...(userId ? { userId } : {}),
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

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 },
      );
    }

    const finalStatus = isStolenReportStatus(body.status)
      ? body.status
      : DEFAULT_STOLEN_REPORT_STATUS;

    const report = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const createdReport = await tx.stolenReport.create({
          data: {
            id: randomUUID(),
            userId: property.userId,
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

        await tx.property.update({
          where: { id: property.id },
          data: { status: "Stolen" },
        });

        return createdReport;
      },
    );

    return NextResponse.json(serializeStolenReport(report), { status: 201 });
  } catch (error) {
    console.error("Error creating stolen report:", error);
    return NextResponse.json(
      { error: "Failed to create stolen report" },
      { status: 500 },
    );
  }
}
