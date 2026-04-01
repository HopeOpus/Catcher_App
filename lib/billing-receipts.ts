import { randomUUID } from "node:crypto";
import {
  Prisma,
  type PaymentCurrency,
  type PaymentProvider,
  type PrismaClient,
  type PropertyPlanCode,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type BillingReceiptWriteClient =
  | Pick<PrismaClient, "billingReceipt">
  | Pick<Prisma.TransactionClient, "billingReceipt">;

export type UpsertBillingReceiptInput = {
  coverageId: string;
  checkoutSessionId?: string | null;
  paymentEventLogId?: string | null;
  userId: string;
  propertyId: string;
  provider?: PaymentProvider;
  reference?: string | null;
  planCode: PropertyPlanCode;
  planName: string;
  amountKobo: number;
  currency: PaymentCurrency;
  startsAt: Date;
  expiresAt?: Date | null;
  snapshot?: Prisma.InputJsonValue | null;
};

function buildReceiptNumber(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const suffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `CTR-${year}${month}${day}-${suffix}`;
}

export async function upsertBillingReceipt(
  input: UpsertBillingReceiptInput,
  db: BillingReceiptWriteClient = prisma,
) {
  const existingReceipt = await db.billingReceipt.findUnique({
    where: { coverageId: input.coverageId },
    select: { id: true, receiptNumber: true },
  });

  return db.billingReceipt.upsert({
    where: { coverageId: input.coverageId },
    update: {
      checkoutSessionId: input.checkoutSessionId ?? null,
      paymentEventLogId: input.paymentEventLogId ?? null,
      userId: input.userId,
      propertyId: input.propertyId,
      provider: input.provider ?? "Paystack",
      reference: input.reference ?? null,
      planCode: input.planCode,
      planName: input.planName,
      amountKobo: input.amountKobo,
      currency: input.currency,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt ?? null,
      issuedAt: new Date(),
      snapshot:
        input.snapshot === undefined
          ? undefined
          : input.snapshot === null
            ? Prisma.JsonNull
            : input.snapshot,
    },
    create: {
      id: existingReceipt?.id ?? randomUUID(),
      receiptNumber: existingReceipt?.receiptNumber ?? buildReceiptNumber(),
      coverageId: input.coverageId,
      checkoutSessionId: input.checkoutSessionId ?? null,
      paymentEventLogId: input.paymentEventLogId ?? null,
      userId: input.userId,
      propertyId: input.propertyId,
      provider: input.provider ?? "Paystack",
      reference: input.reference ?? null,
      planCode: input.planCode,
      planName: input.planName,
      amountKobo: input.amountKobo,
      currency: input.currency,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt ?? null,
      snapshot:
        input.snapshot === undefined
          ? undefined
          : input.snapshot === null
            ? Prisma.JsonNull
            : input.snapshot,
    },
  });
}
