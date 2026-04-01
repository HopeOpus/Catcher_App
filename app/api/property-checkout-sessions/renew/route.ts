import { NextResponse } from "next/server";
import type { PropertyCheckoutSessionStatus } from "@prisma/client";
import {
  isPropertyPlanCode,
  normalizeStoredPhotoUrl,
} from "@/lib/catcher-domain";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { createPropertyCheckoutSession } from "@/lib/property-checkout";
import { syncPropertyLifecycle } from "@/lib/property-lifecycle";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const OPEN_CHECKOUT_STATUSES: PropertyCheckoutSessionStatus[] = [
  "draft",
  "pendingPayment",
  "pendingVerification",
];

function getRequestBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const propertyId =
      typeof body.property_id === "string" ? body.property_id.trim() : "";
    const planCode = body.plan_code;

    if (!propertyId) {
      return NextResponse.json(
        { error: "property_id is required." },
        { status: 400 },
      );
    }

    if (!isPropertyPlanCode(planCode)) {
      return NextResponse.json(
        { error: "plan_code must be one of free, monthly, or yearly." },
        { status: 400 },
      );
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);
    await syncPropertyLifecycle(prisma, {
      userId: authenticatedUser.userId,
      propertyId,
    });

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: authenticatedUser.userId,
      },
      include: {
        photos: {
          orderBy: { uploadedAt: "asc" },
        },
        coverages: {
          orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
        },
        checkoutSessions: {
          where: {
            status: {
              in: OPEN_CHECKOUT_STATUSES,
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    if (property.checkoutSessions.length > 0) {
      return NextResponse.json(
        {
          error:
            "This property already has a checkout in progress. Please complete or cancel it before starting another renewal.",
        },
        { status: 409 },
      );
    }

    const hasScheduledCoverage = property.coverages.some(
      (coverage) =>
        coverage.status === "scheduled" ||
        coverage.startsAt.getTime() > Date.now(),
    );

    if (hasScheduledCoverage) {
      return NextResponse.json(
        {
          error:
            "This property already has a scheduled renewal. Please wait for it to start before creating another one.",
        },
        { status: 409 },
      );
    }

    if (planCode === "free") {
      if (property.archivedAt) {
        return NextResponse.json(
          {
            error: "Archived properties must be restored with a paid plan.",
          },
          { status: 400 },
        );
      }

      if (property.coverages.length > 0) {
        return NextResponse.json(
          {
            error:
              "The free plan is only available during a property's first coverage activation.",
          },
          { status: 400 },
        );
      }
    }

    const photoUrls = property.photos.map((photo) =>
      normalizeStoredPhotoUrl(photo.fileUrl),
    );
    const fallbackPhotoUrl = property.photoUrl
      ? normalizeStoredPhotoUrl(property.photoUrl)
      : null;

    const checkout = await createPropertyCheckoutSession({
      authenticatedUser,
      baseUrl: getRequestBaseUrl(request),
      returnPath: "/dashboard/subscriptions",
      existingPropertyId: property.id,
      name: property.name,
      type: property.type,
      serialNumber: property.serialNumber,
      description: property.description,
      status: property.status,
      photoUrls:
        photoUrls.length > 0
          ? photoUrls
          : fallbackPhotoUrl
            ? [fallbackPhotoUrl]
            : [],
      planCode,
      dateRegistered: property.dateRegistered,
    });

    return NextResponse.json(checkout, {
      status: checkout.mode === "payment" ? 201 : 200,
    });
  } catch (error) {
    console.error("Error creating property renewal checkout session:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to start property renewal.";
    const statusCode =
      errorMessage.includes("free property upload") ? 400 : 500;

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "production" && statusCode === 500
            ? "Failed to start property renewal."
            : errorMessage,
      },
      { status: statusCode },
    );
  }
}
