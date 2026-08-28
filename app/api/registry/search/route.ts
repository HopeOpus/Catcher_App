import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  isLegacyMobilePropertyStatus,
  isPropertyType,
  mapLegacyMobilePropertyStatus,
  mapPropertyStatusToLegacyMobile,
  normalizeStoredPhotoUrl,
} from "@/lib/catcher-domain";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import { prisma } from "@/lib/prisma";

type RegistryPropertyRecord = Prisma.PropertyGetPayload<{
  include: {
    user: {
      select: {
        name: true;
        email: true;
        phoneNumber: true;
        profileImageUrl: true;
        nextOfKinName: true;
        nextOfKinPhone: true;
        nin: true;
      };
    };
    photos: {
      select: {
        fileUrl: true;
      };
    };
  };
}>;

function serializeRegistryProperty(property: RegistryPropertyRecord) {
  const imageUrls = property.photos.map((photo) =>
    normalizeStoredPhotoUrl(photo.fileUrl),
  );
  const coverUrl = property.photoUrl
    ? normalizeStoredPhotoUrl(property.photoUrl)
    : (imageUrls[0] ?? null);

  return {
    id: property.id,
    user_id: property.userId,
    name: property.name,
    serial_number: property.serialNumber,
    category: property.type,
    status: mapPropertyStatusToLegacyMobile(property.status),
    description: property.description,
    owner: property.user.name,
    email: property.user.email,
    phone: property.user.phoneNumber,
    image_url: coverUrl,
    images: imageUrls,
    created_at: property.createdAt.toISOString(),
    updated_at: property.updatedAt.toISOString(),
    owner_avatar_url: property.user.profileImageUrl
      ? normalizeStoredPhotoUrl(property.user.profileImageUrl)
      : null,
    next_of_kin_name: property.user.nextOfKinName,
    next_of_kin_phone: property.user.nextOfKinPhone,
    registrar_name: property.user.name,
    registrar_nin: property.user.nin,
    registrar_email: property.user.email,
    registrar_phone: property.user.phoneNumber,
  };
}

export async function POST(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (authenticatedUser) {
      await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
      await syncPropertyLifecycle(prisma, { userId: authenticatedUser.userId });
    }

    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const serialNumber =
      typeof body.serial_number === "string" ? body.serial_number.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const requestedStatus =
      typeof body.status === "string" ? body.status.trim().toLowerCase() : "";
    const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 50);
    const offset = Math.max(Number(body.offset) || 0, 0);

    if (!query && !serialNumber) {
      return NextResponse.json(
        {
          error: {
            message: "query or serial_number is required",
          },
          data: [],
          count: 0,
          next: null,
          previous: null,
          message: "Please provide a search query.",
        },
        { status: 400 },
      );
    }

    const where: Prisma.PropertyWhereInput = {
      archivedAt: null,
    };

    if (category && isPropertyType(category)) {
      where.type = category;
    }

    if (requestedStatus && isLegacyMobilePropertyStatus(requestedStatus)) {
      where.status = mapLegacyMobilePropertyStatus(requestedStatus);
    }

    const orConditions: Prisma.PropertyWhereInput[] = [];

    if (query) {
      orConditions.push(
        { name: { contains: query, mode: "insensitive" } },
        { serialNumber: { contains: query, mode: "insensitive" } },
        { user: { name: { contains: query, mode: "insensitive" } } },
        { user: { email: { contains: query, mode: "insensitive" } } },
        { user: { phoneNumber: { contains: query, mode: "insensitive" } } },
      );

      if (isPropertyType(query)) {
        orConditions.push({ type: query });
      }

      if (isLegacyMobilePropertyStatus(query.toLowerCase())) {
        orConditions.push({
          status: mapLegacyMobilePropertyStatus(query.toLowerCase()),
        });
      }
    }

    if (serialNumber) {
      orConditions.push({
        serialNumber: { contains: serialNumber, mode: "insensitive" },
      });
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    const [count, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phoneNumber: true,
              profileImageUrl: true,
              nextOfKinName: true,
              nextOfKinPhone: true,
              nin: true,
            },
          },
          photos: {
            orderBy: { uploadedAt: "asc" },
            take: 6,
            select: { fileUrl: true },
          },
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        skip: offset,
        take: limit,
      }),
    ]);

    const data = properties.map(serializeRegistryProperty);
    const next = offset + data.length < count ? offset + data.length : null;
    const previous = offset > 0 ? Math.max(offset - limit, 0) : null;

    return NextResponse.json({
      data,
      error: null,
      status: 200,
      message:
        count > 0
          ? "Registry results fetched successfully."
          : "No matching registry items found.",
      count,
      next,
      previous,
    });
  } catch (error) {
    console.error("Error searching registry:", error);
    return NextResponse.json(
      {
        data: [],
        error: { message: "Failed to search registry" },
        status: 500,
        message: "Failed to search registry",
        count: 0,
        next: null,
        previous: null,
      },
      { status: 500 },
    );
  }
}
