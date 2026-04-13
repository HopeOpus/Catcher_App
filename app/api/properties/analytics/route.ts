import { NextResponse } from "next/server";
import { normalizeStoredPhotoUrl } from "@/lib/catcher-domain";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import { prisma } from "@/lib/prisma";

function mapPropertyStatusToItemStatus(status: string) {
  if (status === "Stolen") return "stolen" as const;
  if (status === "Flagged") return "unknown" as const;
  return "safe" as const;
}

function buildRatios(totals: { total: number; safe: number; stolen: number; unknown: number }) {
  if (totals.total === 0) {
    return { safe: 0, stolen: 0, unknown: 0 };
  }

  return {
    safe: Math.round((totals.safe / totals.total) * 100),
    stolen: Math.round((totals.stolen / totals.total) * 100),
    unknown: Math.round((totals.unknown / totals.total) * 100),
  };
}

export async function GET() {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
    await syncPropertyLifecycle(prisma, { userId: authenticatedUser.userId });

    const properties = await prisma.property.findMany({
      where: {
        userId: authenticatedUser.userId,
        archivedAt: null,
      },
      include: {
        photos: {
          orderBy: { uploadedAt: "asc" },
          take: 1,
          select: { fileUrl: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totals = properties.reduce(
      (acc, property) => {
        acc.total += 1;
        const status = mapPropertyStatusToItemStatus(property.status);
        acc[status] += 1;
        return acc;
      },
      { total: 0, safe: 0, stolen: 0, unknown: 0 },
    );

    const categoryMap = new Map<string, number>();
    for (const property of properties) {
      categoryMap.set(property.type, (categoryMap.get(property.type) ?? 0) + 1);
    }

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);

    const recentItems = properties.slice(0, 5).map((property) => ({
      id: property.id,
      name: property.name,
      status: mapPropertyStatusToItemStatus(property.status),
      category: property.type,
      created_at: property.createdAt.toISOString(),
      image_url: property.photoUrl
        ? normalizeStoredPhotoUrl(property.photoUrl)
        : property.photos[0]
          ? normalizeStoredPhotoUrl(property.photos[0].fileUrl)
          : null,
      serial_number: property.serialNumber,
    }));

    const lastUpdated = properties.reduce<Date | null>((latest, property) => {
      if (!latest || property.updatedAt.getTime() > latest.getTime()) {
        return property.updatedAt;
      }
      return latest;
    }, null);

    return NextResponse.json({
      totals,
      ratios: buildRatios(totals),
      last_updated_at: lastUpdated?.toISOString() ?? null,
      recent: {
        added_last_30d: properties.filter((property) => property.createdAt >= thirtyDaysAgo).length,
        stolen_last_30d: properties.filter(
          (property) => property.status === "Stolen" && property.updatedAt >= thirtyDaysAgo,
        ).length,
      },
      top_categories: topCategories,
      recent_items: recentItems,
    });
  } catch (error) {
    console.error("Error fetching property analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
