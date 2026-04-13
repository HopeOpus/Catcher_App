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
  context: { params: Promise<{ receiptNumber: string }> },
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

    const { receiptNumber } = await context.params;

    if (!receiptNumber) {
      return NextResponse.json({ error: "receiptNumber is required" }, { status: 400 });
    }

    const receipt = await prisma.billingReceipt.findFirst({
      where: {
        receiptNumber,
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
        coverage: {
          select: {
            id: true,
            planCode: true,
            planName: true,
            status: true,
            startsAt: true,
            expiresAt: true,
            graceEndsAt: true,
          },
        },
        paymentEventLog: {
          select: {
            transactionStatus: true,
            reference: true,
          },
        },
      },
    });

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      coverageId: receipt.coverageId,
      checkoutSessionId: receipt.checkoutSessionId,
      paymentEventLogId: receipt.paymentEventLogId,
      userId: receipt.userId,
      propertyId: receipt.propertyId,
      reference: receipt.reference ?? receipt.paymentEventLog?.reference ?? null,
      planCode: receipt.planCode,
      planName: receipt.planName,
      amountKobo: receipt.amountKobo,
      currency: receipt.currency,
      startsAt: receipt.startsAt.toISOString(),
      expiresAt: receipt.expiresAt?.toISOString() ?? null,
      issuedAt: receipt.issuedAt.toISOString(),
      createdAt: receipt.createdAt.toISOString(),
      updatedAt: receipt.updatedAt.toISOString(),
      transactionStatus: receipt.paymentEventLog?.transactionStatus ?? "Confirmed",
      property: serializePropertySummary(receipt.property),
      coverage: receipt.coverage
        ? {
            id: receipt.coverage.id,
            planCode: receipt.coverage.planCode,
            planName: receipt.coverage.planName,
            status: receipt.coverage.status,
            startsAt: receipt.coverage.startsAt.toISOString(),
            expiresAt: receipt.coverage.expiresAt?.toISOString() ?? null,
            graceEndsAt: receipt.coverage.graceEndsAt?.toISOString() ?? null,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching billing receipt:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing receipt" },
      { status: 500 },
    );
  }
}
