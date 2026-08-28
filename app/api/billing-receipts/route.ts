import { NextResponse } from "next/server";
import {
  getAuthenticatedAppUser,
  syncAuthenticatedAppUserRecord,
} from "@/lib/authenticated-user";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await syncAuthenticatedAppUserRecord(prisma, authenticatedUser);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);
    const propertyId = searchParams.get("propertyId")?.trim() || undefined;

    const receipts = await prisma.billingReceipt.findMany({
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
          },
        },
        paymentEventLog: {
          select: {
            transactionStatus: true,
            processingOutcome: true,
            reference: true,
          },
        },
      },
      orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return NextResponse.json({
      data: receipts.map((receipt) => ({
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        propertyId: receipt.propertyId,
        propertyName: receipt.property.name,
        propertyType: receipt.property.type,
        propertySerialNumber: receipt.property.serialNumber,
        propertyPhotoUrl: receipt.property.photoUrl,
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
        transactionStatus: receipt.paymentEventLog?.transactionStatus ?? null,
        processingOutcome: receipt.paymentEventLog?.processingOutcome ?? null,
      })),
      error: null,
      status: 200,
      message: "Billing receipts fetched successfully.",
      count: receipts.length,
    });
  } catch (error) {
    console.error("Error fetching billing receipts:", error);
    return NextResponse.json(
      {
        data: [],
        error: { message: "Failed to fetch billing receipts" },
        status: 500,
        message: "Failed to fetch billing receipts",
        count: 0,
      },
      { status: 500 },
    );
  }
}
