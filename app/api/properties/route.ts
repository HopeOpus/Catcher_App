import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
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

function parsePhotoUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (photoUrl): photoUrl is string =>
      typeof photoUrl === "string" && photoUrl.trim().length > 0,
  );
}

// GET - Fetch all properties or filter by user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const properties = await prisma.property.findMany({
      where: userId ? { userId } : undefined,
      include: {
        photos: {
          orderBy: { uploadedAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(properties.map(serializeProperty));
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}


// POST - Create a new property
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      user_id,
      user_email,
      user_name,
      name,
      type,
      serial_number,
      description,
      status,
      photo_url,
      photo_urls,
    } = body;

    if (!name || !type || !serial_number) {
      return NextResponse.json(
        { error: "name, type, and serial_number are required" },
        { status: 400 },
      );
    }

    if (!isPropertyType(type)) {
      return NextResponse.json(
        { error: "type must be one of Vehicle, Electronics, Jewelry, or Other" },
        { status: 400 },
      );
    }

    if (status && !isPropertyStatus(status)) {
      return NextResponse.json(
        { error: "status must be one of Active, Flagged, or Stolen" },
        { status: 400 },
      );
    }

    const finalUserId = user_id || "default-user";
    const finalUserEmail =
      typeof user_email === "string" && user_email.includes("@")
        ? user_email
        : finalUserId === "default-user"
          ? "default@catcher.com"
          : `${finalUserId}@catcher.local`;
    const finalUserName =
      typeof user_name === "string" && user_name.trim().length > 0
        ? user_name.trim()
        : "Default User";
    const rawPhotoUrls = parsePhotoUrls(photo_urls);
    const normalizedPhotoUrls =
      rawPhotoUrls.length > 0
        ? rawPhotoUrls.map(normalizeStoredPhotoUrl)
        : typeof photo_url === "string" && photo_url.trim().length > 0
          ? [normalizeStoredPhotoUrl(photo_url)]
          : [];

    const property = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        await tx.user.upsert({
          where: { id: finalUserId },
          update: {
            email: finalUserEmail,
            name: finalUserName,
          },
          create: {
            id: finalUserId,
            email: finalUserEmail,
            name: finalUserName,
          },
        });

        return tx.property.create({
          include: {
            photos: {
              orderBy: { uploadedAt: "asc" },
            },
          },
          data: {
            id: randomUUID(),
            userId: finalUserId,
            name,
            type,
            serialNumber: serial_number,
            description: description || null,
            dateRegistered: body.date_registered
              ? new Date(body.date_registered)
              : new Date(),
            status: status || DEFAULT_PROPERTY_STATUS,
            photoUrl: normalizedPhotoUrls[0] ?? null,
            photos: normalizedPhotoUrls.length
              ? {
                  create: normalizedPhotoUrls.map((fileUrl) => ({
                    id: randomUUID(),
                    fileName: extractFileNameFromUrl(fileUrl),
                    fileUrl,
                  })),
                }
              : undefined,
          },
        });
      },
    );

    return NextResponse.json(serializeProperty(property), { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}

// DELETE - Delete a property
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const result = await prisma.property.deleteMany({ where: { id } });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
}
