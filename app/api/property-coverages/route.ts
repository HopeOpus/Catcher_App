import { NextResponse } from "next/server";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { normalizeStoredPhotoUrl } from "@/lib/catcher-domain";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
    await syncPropertyLifecycle(prisma, { userId: authenticatedUser.userId });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);
    const propertyId = searchParams.get("propertyId")?.trim() || undefined;

    const coverages = await prisma.propertyCoverage.findMany({
      where: {
        userId: authenticatedUser.userId,
        ...(propertyId ? { propertyId } : {}),
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
          },
        },
      },
      orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return NextResponse.json({
      data: coverages.map((coverage) => ({
        id: coverage.id,
        propertyId: coverage.propertyId,
        propertyName: coverage.property.name,
        propertyType: coverage.property.type,
        propertySerialNumber: coverage.property.serialNumber,
        propertyPhotoUrl: coverage.property.photoUrl
          ? normalizeStoredPhotoUrl(coverage.property.photoUrl)
          : null,
        propertyDateRegistered: coverage.property.dateRegistered.toISOString(),
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
      })),
      error: null,
      status: 200,
      message: "Property coverages fetched successfully.",
      count: coverages.length,
    });
  } catch (error) {
    console.error("Error fetching property coverages:", error);
    return NextResponse.json(
      {
        data: [],
        error: { message: "Failed to fetch property coverages" },
        status: 500,
        message: "Failed to fetch property coverages",
        count: 0,
      },
      { status: 500 },
    );
  }
}
