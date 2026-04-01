import { randomUUID } from "node:crypto";
import {
  PaymentCurrency,
  PaymentEventSource,
  PaymentProvider,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type RecordPaymentEventInput = {
  provider?: PaymentProvider;
  source: PaymentEventSource;
  reference?: string | null;
  providerEventType?: string | null;
  providerTransactionId?: string | number | null;
  providerEnvironment?: string | null;
  checkoutSessionId?: string | null;
  userId?: string | null;
  propertyId?: string | null;
  coverageId?: string | null;
  amountKobo?: number | null;
  currency?: PaymentCurrency | null;
  transactionStatus?: string | null;
  signatureValid?: boolean | null;
  processingOutcome?: string | null;
  errorMessage?: string | null;
  payload?: Prisma.InputJsonValue | null;
  processedAt?: Date | null;
};

export async function recordPaymentEvent(input: RecordPaymentEventInput) {
  return prisma.paymentEventLog.create({
    data: {
      id: randomUUID(),
      provider: input.provider ?? "Paystack",
      source: input.source,
      reference: input.reference ?? null,
      providerEventType: input.providerEventType ?? null,
      providerTransactionId:
        input.providerTransactionId !== undefined &&
        input.providerTransactionId !== null
          ? String(input.providerTransactionId)
          : null,
      providerEnvironment: input.providerEnvironment ?? null,
      checkoutSessionId: input.checkoutSessionId ?? null,
      userId: input.userId ?? null,
      propertyId: input.propertyId ?? null,
      coverageId: input.coverageId ?? null,
      amountKobo: input.amountKobo ?? null,
      currency: input.currency ?? null,
      transactionStatus: input.transactionStatus ?? null,
      signatureValid: input.signatureValid ?? null,
      processingOutcome: input.processingOutcome ?? null,
      errorMessage: input.errorMessage ?? null,
      payload:
        input.payload === undefined
          ? undefined
          : input.payload === null
            ? Prisma.JsonNull
            : input.payload,
      processedAt: input.processedAt ?? new Date(),
    },
  });
}
