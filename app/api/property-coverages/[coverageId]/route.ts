import { NextResponse } from "next/server";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { normalizeStoredPhotoUrl } from "@/lib/catcher-domain";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import { prisma } from "@/lib/prisma";

function serializePropertySummary(property: {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  photoUrl: string | null;
  dateRegistered: Date;
  photos: Array<{ fileUrl: string }>;
}) {
  const photoUrl = property.photoUrl
    ? normalizeStoredPhotoUrl(property.photoUrl)
    : property.photos[0]
      ? normalizeStoredPhotoUrl(property.photos[0].fileUrl)
      : null;

  return {
    id: property.id,
    name: property.name,
    type: property.type,
    serialNumber: property.serialNumber,
    photoUrl,
    dateRegistered: property.dateRegistered.toISOString(),
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ coverageId: string }> },
) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
    await syncPropertyLifecycle(prisma, {
      userId: authenticatedUser.userId,
    });

    const { coverageId } = await context.params;

    if (!coverageId) {
      return NextResponse.json({ error: "coverageId is required" }, { status: 400 });
    }

    const coverage = await prisma.propertyCoverage.findFirst({
      where: {
        id: coverageId,
        userId: authenticatedUser.userId,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            type: true,
            serialNumber: true,
            photoUrl: true,
            dateRegistered: true,
            photos: {
              orderBy: { uploadedAt: "asc" },
              take: 1,
              select: { fileUrl: true },
            },
          },
        },
      },
    });

    if (!coverage) {
      return NextResponse.json({ error: "Coverage not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: coverage.id,
      propertyId: coverage.propertyId,
      userId: coverage.userId,
      planCode: coverage.planCode,
      planName: coverage.planName,
      priceNgnKobo: coverage.priceNgnKobo,
      currency: coverage.currency,
      status: coverage.status,
      startsAt: coverage.startsAt.toISOString(),
      expiresAt: coverage.expiresAt?.toISOString() ?? null,
      graceEndsAt: coverage.graceEndsAt?.toISOString() ?? null,
      archivedAt: coverage.archivedAt?.toISOString() ?? null,
      paystackReference: coverage.paystackReference,
      createdAt: coverage.createdAt.toISOString(),
      updatedAt: coverage.updatedAt.toISOString(),
      property: serializePropertySummary(coverage.property),
    });
  } catch (error) {
    console.error("Error fetching property coverage:", error);
    return NextResponse.json(
      { error: "Failed to fetch property coverage" },
      { status: 500 },
    );
  }
}
