import { assertAdminAccess } from "@/lib/admin-access";
import { buildCsv, createCsvDownloadResponse } from "@/lib/admin-csv";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await assertAdminAccess();

  const events = await prisma.paymentEventLog.findMany({
    orderBy: { createdAt: "desc" },
  });

  const csv = buildCsv(
    events.map((event) => ({
      id: event.id,
      provider: event.provider,
      source: event.source,
      reference: event.reference ?? "",
      provider_event_type: event.providerEventType ?? "",
      provider_transaction_id: event.providerTransactionId ?? "",
      provider_environment: event.providerEnvironment ?? "",
      checkout_session_id: event.checkoutSessionId ?? "",
      user_id: event.userId ?? "",
      property_id: event.propertyId ?? "",
      coverage_id: event.coverageId ?? "",
      amount_kobo: event.amountKobo ?? "",
      currency: event.currency ?? "",
      transaction_status: event.transactionStatus ?? "",
      signature_valid: event.signatureValid === null ? "" : String(event.signatureValid),
      processing_outcome: event.processingOutcome ?? "",
      error_message: event.errorMessage ?? "",
      processed_at: event.processedAt?.toISOString() ?? "",
      created_at: event.createdAt.toISOString(),
    })),
  );

  return createCsvDownloadResponse("admin-payment-events.csv", csv);
}
