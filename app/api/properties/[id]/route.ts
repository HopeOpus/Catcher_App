import { NextResponse } from "next/server";
import { normalizeStoredPhotoUrl } from "@/lib/catcher-domain";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import { prisma } from "@/lib/prisma";

function serializeProperty(property: {
  id: string;
  userId: string;
  name: string;
  type: string;
  serialNumber: string;
  description: string | null;
  dateRegistered: Date;
  status: string;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  photos: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
  }>;
}) {
  const photoUrls = property.photos.map((photo) => normalizeStoredPhotoUrl(photo.fileUrl));
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
    const { id } = await context.params;

    await syncPropertyLifecycle(prisma, {
      userId: authenticatedUser.userId,
      propertyId: id,
    });

    const property = await prisma.property.findFirst({
      where: {
        id,
        userId: authenticatedUser.userId,
        archivedAt: null,
      },
      include: {
        photos: {
          orderBy: { uploadedAt: "asc" },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json(serializeProperty(property));
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json(
      { error: "Failed to fetch property" },
      { status: 500 },
    );
  }
}
