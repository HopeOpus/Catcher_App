import type { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  DEFAULT_PROPERTY_STATUS,
  extractFileNameFromUrl,
  isPropertyStatus,
  isPropertyType,
  normalizeStoredPhotoUrl,
  type PropertyStatusValue,
  type PropertyTypeValue,
} from "@/lib/catcher-domain";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import { parseSubmittedPhotoUrls } from "@/lib/property-payload";
import { prisma } from "@/lib/prisma";

type PropertyRecord = {
  id: string;
  userId: string;
  name: string;
  type: PropertyTypeValue;
  serialNumber: string;
  description: string | null;
  dateRegistered: Date;
  status: PropertyStatusValue;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  photos: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
  }>;
};

function serializeProperty(property: PropertyRecord) {
  const photoUrls = property.photos.map((photo) =>
    normalizeStoredPhotoUrl(photo.fileUrl),
  );
  const coverPhoto = property.photoUrl
    ? normalizeStoredPhotoUrl(property.photoUrl)
    : (photoUrls[0] ?? null);

  return {
    id: property.id,
    user_id: property.userId,
    name: property.name,
    type: property.type,
    serial_number: property.serialNumber,
    description: property.description,
    date_registered: property.dateRegistered,
    status: property.status,
    photo_url: coverPhoto,
    photo_urls: photoUrls,
    property_photos: property.photos.map((photo) => ({
      id: photo.id,
      file_name: photo.fileName,
      file_url: normalizeStoredPhotoUrl(photo.fileUrl),
    })),
    created_at: property.createdAt,
    updated_at: property.updatedAt,
  };
}

function buildPropertyQueryFilters(
  searchParams: URLSearchParams,
  userId: string,
): Prisma.PropertyWhereInput {
  const status = searchParams.get("status")?.trim() ?? "";
  const query = searchParams.get("query")?.trim() ?? "";

  const where: Prisma.PropertyWhereInput = {
    userId,
    archivedAt: null,
  };

  if (status && status !== "all" && isPropertyStatus(status)) {
    where.status = status;
  }

  if (query) {
    const orConditions: Prisma.PropertyWhereInput[] = [
      { name: { contains: query, mode: "insensitive" } },
      { serialNumber: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];

    if (isPropertyType(query)) {
      orConditions.push({ type: query });
    }

    if (isPropertyStatus(query)) {
      orConditions.push({ status: query });
    }

    where.OR = orConditions;
  }

  return where;
}

export async function GET(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
    await syncPropertyLifecycle(prisma, {
      userId: authenticatedUser.userId,
    });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
    const where = buildPropertyQueryFilters(searchParams, authenticatedUser.userId);

    const [count, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        include: {
          photos: {
            orderBy: { uploadedAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
    ]);

    const data = properties.map(serializeProperty);
    const next = offset + data.length < count ? String(offset + data.length) : "";
    const previous = offset > 0 ? String(Math.max(offset - limit, 0)) : "";

    return NextResponse.json({
      data,
      error: null,
      status: 200,
      message: "Properties fetched successfully.",
      count,
      next,
      previous,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 },
    );
  }
}

// POST - Create a new property
export async function POST(request: Request) {
  void request;

  return NextResponse.json(
    {
      error:
        "New property registration now starts through the property checkout flow. Use /api/property-checkout-sessions instead.",
    },
    { status: 405 },
  );
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      type,
      serial_number,
      description,
      status,
      photo_url,
      photo_urls,
      date_registered,
    } = body;

    if (!id || !name || !type || !serial_number) {
      return NextResponse.json(
        { error: "id, name, type, and serial_number are required" },
        { status: 400 },
      );
    }

    if (!isPropertyType(type)) {
      return NextResponse.json(
        {
          error:
            "type must be one of Vehicle, Electronics, Jewelry, Document, or Other",
        },
        { status: 400 },
      );
    }

    if (status && !isPropertyStatus(status)) {
      return NextResponse.json(
        { error: "status must be one of Active, Flagged, or Stolen" },
        { status: 400 },
      );
    }

    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submittedPhotoUrls = parseSubmittedPhotoUrls(photo_urls, photo_url);

    if (submittedPhotoUrls.invalid) {
      return NextResponse.json(
        {
          error:
            "One or more photo uploads were not persisted. Please re-upload your photos and try again.",
        },
        { status: 400 },
      );
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
    await syncPropertyLifecycle(prisma, {
      userId: authenticatedUser.userId,
      propertyId: id,
    });

    const existingProperty = await prisma.property.findFirst({
      where: {
        id,
        userId: authenticatedUser.userId,
        archivedAt: null,
      },
      select: { id: true },
    });

    if (!existingProperty) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const property = await prisma.property.update({
      where: { id },
      include: {
        photos: {
          orderBy: { uploadedAt: "asc" },
        },
      },
      data: {
        name,
        type,
        serialNumber: serial_number,
        description: description || null,
        dateRegistered: date_registered ? new Date(date_registered) : undefined,
        status: status || DEFAULT_PROPERTY_STATUS,
        photoUrl: submittedPhotoUrls.urls[0] ?? null,
        photos: {
          deleteMany: {},
          create: submittedPhotoUrls.urls.map((fileUrl) => ({
            id: randomUUID(),
            fileName: extractFileNameFromUrl(fileUrl),
            fileUrl,
          })),
        },
      },
    });

    return NextResponse.json(serializeProperty(property));
  } catch (error) {
    console.error("Error updating property:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update property";

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Failed to update property"
            : errorMessage,
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete a property
export async function DELETE(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 },
      );
    }

    await syncPropertyLifecycle(prisma, {
      userId: authenticatedUser.userId,
      propertyId: id,
    });

    const result = await prisma.property.deleteMany({
      where: { id, userId: authenticatedUser.userId, archivedAt: null },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 },
    );
  }
}
