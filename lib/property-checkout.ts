import { randomUUID } from "node:crypto";
import type {
  Prisma,
  PaymentEventSource,
  PropertyStatus,
} from "@prisma/client";
import type { AuthenticatedAppUser } from "@/lib/authenticated-user";
import {
  extractFileNameFromUrl,
  type PropertyPlanCodeValue,
  type PropertyTypeValue,
} from "@/lib/catcher-domain";
import {
  getConfiguredPaystackEnvironment,
  initializePaystackTransaction,
  verifyPaystackTransaction,
} from "@/lib/paystack";
import { recordPaymentEvent } from "@/lib/payment-event-log";
import {
  FREE_PROPERTY_PLAN_LIFETIME_LIMIT,
  buildPropertyCoverageWindow,
  getPropertyPlanDefinition,
} from "@/lib/property-plans";
import {
  sendPaymentFailureEmailForCheckoutSession,
  sendPaymentSuccessEmailForCheckoutSession,
  sendRestoreConfirmationEmailForCheckoutSession,
} from "@/lib/property-notification-emails";
import { upsertBillingReceipt } from "@/lib/billing-receipts";
import {
  buildPropertyVerificationPath,
  ensurePropertyPublicVerification,
} from "@/lib/property-public-verification";
import { safeCreateNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export type PropertyCheckoutReturnPath =
  | "/dashboard/properties"
  | "/dashboard/subscriptions";

type CreatePropertyCheckoutInput = {
  authenticatedUser: AuthenticatedAppUser;
  baseUrl: string;
  returnPath?: PropertyCheckoutReturnPath;
  existingPropertyId?: string | null;
  name: string;
  type: PropertyTypeValue;
  serialNumber: string;
  description: string | null;
  status: PropertyStatus;
  photoUrls: string[];
  planCode: PropertyPlanCodeValue;
  dateRegistered?: Date;
};

type CreatePropertyCheckoutResult =
  | {
      mode: "free";
      checkoutSessionId: string;
      propertyId: string;
      coverageId: string;
    }
  | {
      mode: "payment";
      checkoutSessionId: string;
      reference: string;
      authorizationUrl: string;
    };

type CheckoutCompletionResult =
  | {
      outcome: "completed";
      checkoutSessionId: string;
      propertyId: string;
      coverageId: string;
    }
  | {
      outcome: "failed" | "pending" | "review" | "not_found";
      checkoutSessionId?: string;
      message: string;
    };

type PaystackSettlementContext = {
  settledAt: Date;
  paystackReference?: string | null;
  paystackCustomerCode?: string | null;
  paystackAuthorizationCode?: string | null;
  paystackSubscriptionCode?: string | null;
};

type FinalizePaystackCheckoutOptions = {
  source?: PaymentEventSource;
  providerEventType?: string | null;
  signatureValid?: boolean | null;
  payload?: Prisma.InputJsonValue | null;
};

const PENDING_PAYSTACK_STATUSES = new Set([
  "pending",
  "ongoing",
  "processing",
  "queued",
]);

function buildCheckoutSessionPropertyId(sessionId: string): string {
  return `property_${sessionId}`;
}

function buildCheckoutSessionCoverageId(sessionId: string): string {
  return `coverage_${sessionId}`;
}

function buildPaystackReference(sessionId: string): string {
  const compactSessionId = sessionId.replace(/[^a-zA-Z0-9]/g, "");
  return `catcher_${compactSessionId}_${Date.now()}`;
}

function buildPaystackMetadata(options: {
  checkoutSessionId: string;
  userId: string;
  planCode: PropertyPlanCodeValue;
  propertyName: string;
  returnPath: PropertyCheckoutReturnPath;
  cancelActionUrl: string;
}) {
  return {
    draftId: options.checkoutSessionId,
    userId: options.userId,
    planCode: options.planCode,
    propertyName: options.propertyName,
    returnPath: options.returnPath,
    cancel_action: options.cancelActionUrl,
    custom_fields: [
      {
        display_name: "Draft ID",
        variable_name: "draft_id",
        value: options.checkoutSessionId,
      },
      {
        display_name: "Property Plan",
        variable_name: "plan_code",
        value: options.planCode,
      },
      {
        display_name: "Property Name",
        variable_name: "property_name",
        value: options.propertyName,
      },
      {
        display_name: "Return Path",
        variable_name: "return_path",
        value: options.returnPath,
      },
    ],
  };
}

function normalizePropertyCheckoutReturnPath(
  value: string | null | undefined,
  hasExistingProperty: boolean,
): PropertyCheckoutReturnPath {
  if (value === "/dashboard/subscriptions") {
    return value;
  }

  if (value === "/dashboard/properties") {
    return value;
  }

  return hasExistingProperty
    ? "/dashboard/subscriptions"
    : "/dashboard/properties";
}

function buildPhotoRecords(checkoutSessionId: string, photoUrls: string[]) {
  return photoUrls.map((fileUrl, index) => ({
    id: `photo_${checkoutSessionId}_${index + 1}`,
    fileName: extractFileNameFromUrl(fileUrl),
    fileUrl,
  }));
}

async function safeRecordPaymentEvent(
  input: Parameters<typeof recordPaymentEvent>[0],
) {
  try {
    return await recordPaymentEvent(input);
  } catch (error) {
    console.error("Failed to record payment event:", error);
    return null;
  }
}

function buildBillingReceiptSnapshot(options: {
  propertyId: string;
  propertyName: string;
  serialNumber: string;
  checkoutSessionId: string;
  coverageId: string;
  planCode: PropertyPlanCodeValue;
  planName: string;
  amountKobo: number;
  startsAt: Date;
  expiresAt: Date | null;
  paystackReference: string | null;
  verificationSlug?: string | null;
}) {
  return {
    propertyId: options.propertyId,
    propertyName: options.propertyName,
    serialNumber: options.serialNumber,
    checkoutSessionId: options.checkoutSessionId,
    coverageId: options.coverageId,
    planCode: options.planCode,
    planName: options.planName,
    amountKobo: options.amountKobo,
    startsAt: options.startsAt.toISOString(),
    expiresAt: options.expiresAt?.toISOString() ?? null,
    paystackReference: options.paystackReference,
    verificationPath: options.verificationSlug
      ? buildPropertyVerificationPath(options.verificationSlug)
      : null,
  };
}

async function activatePropertyCheckoutSession(
  checkoutSessionId: string,
  settlement: PaystackSettlementContext,
): Promise<CheckoutCompletionResult> {
  const session = await prisma.propertyCheckoutSession.findUnique({
    where: { id: checkoutSessionId },
  });

  if (!session) {
    return {
      outcome: "not_found",
      message: "Property checkout session could not be found.",
    };
  }

  if (session.status === "completed" && session.propertyId && session.coverageId) {
    return {
      outcome: "completed",
      checkoutSessionId: session.id,
      propertyId: session.propertyId,
      coverageId: session.coverageId,
    };
  }

  const propertyId = session.propertyId || buildCheckoutSessionPropertyId(session.id);
  const coverageId = session.coverageId || buildCheckoutSessionCoverageId(session.id);
  const photoRecords = buildPhotoRecords(session.id, session.photoUrls);
  const coverPhotoUrl = session.coverPhotoUrl || session.photoUrls[0] || null;
  const existingProperty = session.propertyId
    ? await prisma.property.findUnique({
        where: { id: session.propertyId },
        select: {
          archivedAt: true,
        },
      })
    : null;
  const propertyWasArchivedBeforeActivation = Boolean(existingProperty?.archivedAt);
  const latestCoverage = session.propertyId
    ? await prisma.propertyCoverage.findFirst({
        where: {
          propertyId: session.propertyId,
        },
        orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      })
    : null;
  const coverageWindow = buildPropertyCoverageWindow({
    planCode: session.planCode,
    settledAt: settlement.settledAt,
    renewFromExpiresAt: latestCoverage?.expiresAt ?? null,
  });
  const coverageStatus =
    coverageWindow.startsAt.getTime() > settlement.settledAt.getTime()
      ? "scheduled"
      : "active";

  const [, , checkoutSessionUpdateResult] = await prisma.$transaction([
    prisma.property.upsert({
      where: { id: propertyId },
      create: {
        id: propertyId,
        userId: session.userId,
        name: session.name,
        type: session.type,
        serialNumber: session.serialNumber,
        description: session.description,
        dateRegistered: session.dateRegistered,
        status: session.propertyStatus,
        photoUrl: coverPhotoUrl,
        archivedAt: null,
        archiveReason: null,
        restorable: false,
        photos: photoRecords.length
          ? {
              create: photoRecords,
            }
          : undefined,
      },
      update: {
        userId: session.userId,
        name: session.name,
        type: session.type,
        serialNumber: session.serialNumber,
        description: session.description,
        dateRegistered: session.dateRegistered,
        status: session.propertyStatus,
        photoUrl: coverPhotoUrl,
        archivedAt: null,
        archiveReason: null,
        restorable: false,
        photos: {
          deleteMany: {},
          create: photoRecords,
        },
      },
    }),
    prisma.propertyCoverage.upsert({
      where: { id: coverageId },
      create: {
        id: coverageId,
        propertyId,
        userId: session.userId,
        planCode: session.planCode,
        planName: session.planName,
        priceNgnKobo: session.priceNgnKobo,
        currency: session.currency,
        status: coverageStatus,
        startsAt: coverageWindow.startsAt,
        expiresAt: coverageWindow.expiresAt,
        graceEndsAt: coverageWindow.graceEndsAt,
        archivedAt: null,
        renewedFromId: latestCoverage?.id ?? null,
        paystackReference:
          settlement.paystackReference ?? session.paystackReference ?? null,
        paystackCustomerCode:
          settlement.paystackCustomerCode ?? session.paystackCustomerCode ?? null,
        paystackSubscriptionCode: settlement.paystackSubscriptionCode ?? null,
        paystackAuthorizationCode:
          settlement.paystackAuthorizationCode ?? null,
      },
      update: {
        propertyId,
        userId: session.userId,
        planCode: session.planCode,
        planName: session.planName,
        priceNgnKobo: session.priceNgnKobo,
        currency: session.currency,
        status: coverageStatus,
        startsAt: coverageWindow.startsAt,
        expiresAt: coverageWindow.expiresAt,
        graceEndsAt: coverageWindow.graceEndsAt,
        archivedAt: null,
        renewedFromId: latestCoverage?.id ?? null,
        paystackReference:
          settlement.paystackReference ?? session.paystackReference ?? null,
        paystackCustomerCode:
          settlement.paystackCustomerCode ?? session.paystackCustomerCode ?? null,
        paystackSubscriptionCode: settlement.paystackSubscriptionCode ?? null,
        paystackAuthorizationCode:
          settlement.paystackAuthorizationCode ?? null,
      },
    }),
    prisma.propertyCheckoutSession.updateMany({
      where: {
        id: session.id,
        status: {
          not: "completed",
        },
      },
      data: {
        status: "completed",
        propertyId,
        coverageId,
        completedAt: settlement.settledAt,
        paystackReference:
          settlement.paystackReference ?? session.paystackReference ?? null,
        paystackCustomerCode:
          settlement.paystackCustomerCode ?? session.paystackCustomerCode ?? null,
      },
    }),
  ]);

  const newlyCompleted = checkoutSessionUpdateResult.count > 0;
  let verificationRecord: Awaited<
    ReturnType<typeof ensurePropertyPublicVerification>
  > | null = null;

  try {
    verificationRecord = await ensurePropertyPublicVerification({
      propertyId,
      propertyName: session.name,
      serialNumber: session.serialNumber,
    });
  } catch (error) {
    console.error("Failed to ensure property public verification:", error);
  }

  let linkedPaymentEventId: string | null = null;

  if (settlement.paystackReference ?? session.paystackReference) {
    try {
      const linkedPaymentEvent = await prisma.paymentEventLog.findFirst({
        where: {
          reference: settlement.paystackReference ?? session.paystackReference ?? null,
        },
        orderBy: [{ processedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
        },
      });

      linkedPaymentEventId = linkedPaymentEvent?.id ?? null;
    } catch (error) {
      console.error("Failed to load linked payment event log:", error);
    }
  }

  try {
    await upsertBillingReceipt({
      coverageId,
      checkoutSessionId,
      paymentEventLogId: linkedPaymentEventId,
      userId: session.userId,
      propertyId,
      reference: settlement.paystackReference ?? session.paystackReference ?? null,
      planCode: session.planCode,
      planName: session.planName,
      amountKobo: session.priceNgnKobo,
      currency: session.currency,
      startsAt: coverageWindow.startsAt,
      expiresAt: coverageWindow.expiresAt,
      snapshot: buildBillingReceiptSnapshot({
        propertyId,
        propertyName: session.name,
        serialNumber: session.serialNumber,
        checkoutSessionId,
        coverageId,
        planCode: session.planCode,
        planName: session.planName,
        amountKobo: session.priceNgnKobo,
        startsAt: coverageWindow.startsAt,
        expiresAt: coverageWindow.expiresAt,
        paystackReference:
          settlement.paystackReference ?? session.paystackReference ?? null,
        verificationSlug: verificationRecord?.slug ?? null,
      }),
    });
  } catch (error) {
    console.error("Failed to upsert billing receipt:", error);
  }

  if (settlement.paystackReference && newlyCompleted) {
    try {
      await sendPaymentSuccessEmailForCheckoutSession(checkoutSessionId);
    } catch (error) {
      console.error("Failed to send payment success email:", error);
    }

    await safeCreateNotification({
      userId: session.userId,
      type: "PaymentReceived",
      title: `${session.name} payment received`,
      message:
        "Your payment has been confirmed and the property subscription is now active on your account.",
      linkPath: "/dashboard/subscriptions",
      propertyId,
      coverageId,
      paymentEventLogId: linkedPaymentEventId,
      payload: {
        reference: settlement.paystackReference ?? session.paystackReference ?? null,
        planName: session.planName,
      },
    });
  }

  if (newlyCompleted && propertyWasArchivedBeforeActivation) {
    try {
      await sendRestoreConfirmationEmailForCheckoutSession(checkoutSessionId);
    } catch (error) {
      console.error("Failed to send restore confirmation email:", error);
    }

    await safeCreateNotification({
      userId: session.userId,
      type: "PropertyRestored",
      title: `${session.name} has been restored`,
      message:
        "This property was restored after a successful renewal and is active in your protected records again.",
      linkPath: "/dashboard/subscriptions",
      propertyId,
      coverageId,
      paymentEventLogId: linkedPaymentEventId,
    });
  }

  return {
    outcome: "completed",
    checkoutSessionId,
    propertyId,
    coverageId,
  };
}

async function markCheckoutSessionForReview(
  checkoutSessionId: string,
  customerCode: string | null,
) {
  await prisma.propertyCheckoutSession.update({
    where: { id: checkoutSessionId },
    data: {
      status: "pendingVerification",
      paystackCustomerCode: customerCode,
    },
  });
}

export async function createPropertyCheckoutSession(
  input: CreatePropertyCheckoutInput,
): Promise<CreatePropertyCheckoutResult> {
  if (input.planCode === "free") {
    const existingFreeCoverageCount = await prisma.propertyCoverage.count({
      where: {
        userId: input.authenticatedUser.userId,
        planCode: "free",
      },
    });

    if (existingFreeCoverageCount >= FREE_PROPERTY_PLAN_LIFETIME_LIMIT) {
      throw new Error(
        "Your account has already used its one free property upload. Choose Monthly or Yearly to continue.",
      );
    }
  }

  const plan = getPropertyPlanDefinition(input.planCode);
  const checkoutSessionId = randomUUID();
  const dateRegistered = input.dateRegistered ?? new Date();
  const returnPath = normalizePropertyCheckoutReturnPath(
    input.returnPath,
    Boolean(input.existingPropertyId),
  );

  await prisma.propertyCheckoutSession.create({
    data: {
      id: checkoutSessionId,
      userId: input.authenticatedUser.userId,
      propertyId: input.existingPropertyId ?? null,
      returnPath,
      name: input.name,
      type: input.type,
      serialNumber: input.serialNumber,
      description: input.description,
      propertyStatus: input.status,
      dateRegistered,
      coverPhotoUrl: input.photoUrls[0] ?? null,
      photoUrls: input.photoUrls,
      planCode: input.planCode,
      planName: plan.name,
      priceNgnKobo: plan.priceNgnKobo,
      currency: "NGN",
      status: "draft",
    },
  });

  if (input.planCode === "free") {
    const completion = await activatePropertyCheckoutSession(checkoutSessionId, {
      settledAt: new Date(),
    });

    if (completion.outcome !== "completed") {
      throw new Error(completion.message);
    }

    return {
      mode: "free",
      checkoutSessionId: completion.checkoutSessionId,
      propertyId: completion.propertyId,
      coverageId: completion.coverageId,
    };
  }

  const reference = buildPaystackReference(checkoutSessionId);
  const callbackUrl = `${input.baseUrl}/payments/paystack/callback`;
  const cancelActionUrl = `${input.baseUrl}/payments/paystack/cancel?reference=${encodeURIComponent(reference)}`;

  try {
    const initializedTransaction = await initializePaystackTransaction({
      amountKobo: plan.priceNgnKobo,
      email: input.authenticatedUser.email,
      reference,
      callbackUrl,
      metadata: buildPaystackMetadata({
        checkoutSessionId,
        userId: input.authenticatedUser.userId,
        planCode: input.planCode,
        propertyName: input.name,
        returnPath,
        cancelActionUrl,
      }),
    });

    await prisma.propertyCheckoutSession.update({
      where: { id: checkoutSessionId },
      data: {
        status: "pendingPayment",
        paystackReference: initializedTransaction.reference,
        paystackAccessCode: initializedTransaction.access_code,
        paystackAuthorizationUrl: initializedTransaction.authorization_url,
      },
    });

    await safeRecordPaymentEvent({
      source: "initialize",
      reference: initializedTransaction.reference,
      providerEventType: "transaction.initialize",
      providerEnvironment: getConfiguredPaystackEnvironment(),
      checkoutSessionId,
      userId: input.authenticatedUser.userId,
      propertyId: input.existingPropertyId ?? null,
      amountKobo: plan.priceNgnKobo,
      currency: "NGN",
      transactionStatus: "initialized",
      processingOutcome: "authorization_url_received",
      payload: {
        authorizationUrl: initializedTransaction.authorization_url,
        accessCode: initializedTransaction.access_code,
        metadata: buildPaystackMetadata({
          checkoutSessionId,
          userId: input.authenticatedUser.userId,
          planCode: input.planCode,
          propertyName: input.name,
          returnPath,
          cancelActionUrl,
        }),
      },
    });

    return {
      mode: "payment",
      checkoutSessionId,
      reference: initializedTransaction.reference,
      authorizationUrl: initializedTransaction.authorization_url,
    };
  } catch (error) {
    await prisma.propertyCheckoutSession
      .update({
        where: { id: checkoutSessionId },
        data: {
          status: "cancelled",
        },
      })
      .catch(() => undefined);

    await safeRecordPaymentEvent({
      source: "initialize",
      reference,
      providerEventType: "transaction.initialize",
      providerEnvironment: getConfiguredPaystackEnvironment(),
      checkoutSessionId,
      userId: input.authenticatedUser.userId,
      propertyId: input.existingPropertyId ?? null,
      amountKobo: plan.priceNgnKobo,
      currency: "NGN",
      transactionStatus: "failed",
      processingOutcome: "initialize_failed",
      errorMessage:
        error instanceof Error ? error.message : "Failed to initialize Paystack checkout.",
      payload: {
        planCode: input.planCode,
        propertyName: input.name,
      },
    });

    throw error;
  }
}

export async function finalizeFreePropertyCheckoutSession(
  checkoutSessionId: string,
): Promise<CheckoutCompletionResult> {
  return activatePropertyCheckoutSession(checkoutSessionId, {
    settledAt: new Date(),
  });
}

export async function getPropertyCheckoutReturnPathByReference(
  reference: string,
): Promise<PropertyCheckoutReturnPath> {
  const checkoutSession = await prisma.propertyCheckoutSession.findUnique({
    where: { paystackReference: reference },
    select: {
      propertyId: true,
      returnPath: true,
    },
  });

  return normalizePropertyCheckoutReturnPath(
    checkoutSession?.returnPath,
    Boolean(checkoutSession?.propertyId),
  );
}

export async function finalizePaystackCheckoutByReference(
  reference: string,
  options: FinalizePaystackCheckoutOptions = {},
): Promise<CheckoutCompletionResult> {
  const source = options.source ?? "verify";
  const checkoutSession = await prisma.propertyCheckoutSession.findUnique({
    where: { paystackReference: reference },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!checkoutSession) {
    await safeRecordPaymentEvent({
      source,
      reference,
      providerEventType: options.providerEventType ?? "transaction.verify",
      providerEnvironment: getConfiguredPaystackEnvironment(),
      signatureValid: options.signatureValid ?? null,
      processingOutcome: "checkout_session_not_found",
      payload: options.payload ?? { reference },
    });

    return {
      outcome: "not_found",
      message: "No property checkout session was found for this payment reference.",
    };
  }

  if (
    checkoutSession.status === "completed" &&
    checkoutSession.propertyId &&
    checkoutSession.coverageId
  ) {
    await safeRecordPaymentEvent({
      source,
      reference,
      providerEventType: options.providerEventType ?? "transaction.verify",
      providerEnvironment: getConfiguredPaystackEnvironment(),
      checkoutSessionId: checkoutSession.id,
      userId: checkoutSession.user.id,
      propertyId: checkoutSession.propertyId,
      coverageId: checkoutSession.coverageId,
      amountKobo: checkoutSession.priceNgnKobo,
      currency: checkoutSession.currency,
      signatureValid: options.signatureValid ?? null,
      transactionStatus: "success",
      processingOutcome: "already_completed",
      payload: options.payload ?? { reference },
    });

    return {
      outcome: "completed",
      checkoutSessionId: checkoutSession.id,
      propertyId: checkoutSession.propertyId,
      coverageId: checkoutSession.coverageId,
    };
  }

  let verifiedTransaction;

  try {
    verifiedTransaction = await verifyPaystackTransaction(reference);
  } catch (error) {
    await safeRecordPaymentEvent({
      source,
      reference,
      providerEventType: options.providerEventType ?? "transaction.verify",
      providerEnvironment: getConfiguredPaystackEnvironment(),
      checkoutSessionId: checkoutSession.id,
      userId: checkoutSession.user.id,
      propertyId: checkoutSession.propertyId,
      coverageId: checkoutSession.coverageId,
      amountKobo: checkoutSession.priceNgnKobo,
      currency: checkoutSession.currency,
      signatureValid: options.signatureValid ?? null,
      processingOutcome: "verify_failed",
      errorMessage:
        error instanceof Error ? error.message : "Paystack verification request failed.",
      payload: options.payload ?? { reference },
    });

    throw error;
  }

  const verificationPayload = options.payload
    ? ({
        trigger: options.payload,
        verification: verifiedTransaction,
      } as Prisma.InputJsonValue)
    : (verifiedTransaction as Prisma.InputJsonValue);

  if (verifiedTransaction.status !== "success") {
    if (PENDING_PAYSTACK_STATUSES.has(verifiedTransaction.status)) {
      await safeRecordPaymentEvent({
        source,
        reference,
        providerEventType: options.providerEventType ?? "transaction.verify",
        providerTransactionId: verifiedTransaction.id,
        providerEnvironment:
          verifiedTransaction.domain ?? getConfiguredPaystackEnvironment(),
        checkoutSessionId: checkoutSession.id,
        userId: checkoutSession.user.id,
        propertyId: checkoutSession.propertyId,
        coverageId: checkoutSession.coverageId,
        amountKobo: verifiedTransaction.amount,
        currency: checkoutSession.currency,
        transactionStatus: verifiedTransaction.status,
        signatureValid: options.signatureValid ?? null,
        processingOutcome: "pending",
        payload: verificationPayload,
      });

      return {
        outcome: "pending",
        checkoutSessionId: checkoutSession.id,
        message: "Payment is still being processed by Paystack.",
      };
    }

    try {
      await sendPaymentFailureEmailForCheckoutSession(
        checkoutSession.id,
        verifiedTransaction.status,
      );
    } catch (error) {
      console.error("Failed to send payment failure email:", error);
    }

    const failedPaymentEvent = await safeRecordPaymentEvent({
      source,
      reference,
      providerEventType: options.providerEventType ?? "transaction.verify",
      providerTransactionId: verifiedTransaction.id,
      providerEnvironment:
        verifiedTransaction.domain ?? getConfiguredPaystackEnvironment(),
      checkoutSessionId: checkoutSession.id,
      userId: checkoutSession.user.id,
      propertyId: checkoutSession.propertyId,
      coverageId: checkoutSession.coverageId,
      amountKobo: verifiedTransaction.amount,
      currency: checkoutSession.currency,
      transactionStatus: verifiedTransaction.status,
      signatureValid: options.signatureValid ?? null,
      processingOutcome: "failed",
      payload: verificationPayload,
    });

    await safeCreateNotification({
      userId: checkoutSession.user.id,
      type: "PaymentFailed",
      title: `${checkoutSession.name} payment needs attention`,
      message: `We could not complete the ${checkoutSession.planName} property subscription payment. Choose another subscription or try again.`,
      linkPath: normalizePropertyCheckoutReturnPath(
        checkoutSession.returnPath,
        Boolean(checkoutSession.propertyId),
      ),
      propertyId: checkoutSession.propertyId,
      coverageId: checkoutSession.coverageId,
      paymentEventLogId: failedPaymentEvent?.id ?? null,
      payload: {
        reference,
        status: verifiedTransaction.status,
        planName: checkoutSession.planName,
      },
    });

    return {
      outcome: "failed",
      checkoutSessionId: checkoutSession.id,
      message: `Payment was not successful. Paystack returned: ${verifiedTransaction.status}.`,
    };
  }

  const verifiedEmail = verifiedTransaction.customer?.email?.trim().toLowerCase();
  const expectedEmail = checkoutSession.user.email.trim().toLowerCase();

  if (
    verifiedTransaction.amount !== checkoutSession.priceNgnKobo ||
    verifiedTransaction.currency !== checkoutSession.currency ||
    (verifiedEmail && verifiedEmail !== expectedEmail)
  ) {
    await markCheckoutSessionForReview(
      checkoutSession.id,
      verifiedTransaction.customer?.customer_code ?? null,
    );

    await safeRecordPaymentEvent({
      source,
      reference,
      providerEventType: options.providerEventType ?? "transaction.verify",
      providerTransactionId: verifiedTransaction.id,
      providerEnvironment:
        verifiedTransaction.domain ?? getConfiguredPaystackEnvironment(),
      checkoutSessionId: checkoutSession.id,
      userId: checkoutSession.user.id,
      propertyId: checkoutSession.propertyId,
      coverageId: checkoutSession.coverageId,
      amountKobo: verifiedTransaction.amount,
      currency: checkoutSession.currency,
      transactionStatus: verifiedTransaction.status,
      signatureValid: options.signatureValid ?? null,
      processingOutcome: "review",
      payload: verificationPayload,
    });

    return {
      outcome: "review",
      checkoutSessionId: checkoutSession.id,
      message:
        "Payment was received but requires manual review before the property can be activated.",
    };
  }

  const completionResult = await activatePropertyCheckoutSession(checkoutSession.id, {
    settledAt: verifiedTransaction.paid_at
      ? new Date(verifiedTransaction.paid_at)
      : new Date(),
    paystackReference: verifiedTransaction.reference,
    paystackCustomerCode:
      verifiedTransaction.customer?.customer_code ?? null,
    paystackAuthorizationCode:
      verifiedTransaction.authorization?.authorization_code ?? null,
  });

  await safeRecordPaymentEvent({
    source,
    reference,
    providerEventType: options.providerEventType ?? "transaction.verify",
    providerTransactionId: verifiedTransaction.id,
    providerEnvironment:
      verifiedTransaction.domain ?? getConfiguredPaystackEnvironment(),
    checkoutSessionId: checkoutSession.id,
    userId: checkoutSession.user.id,
    propertyId:
      completionResult.outcome === "completed"
        ? completionResult.propertyId
        : checkoutSession.propertyId,
    coverageId:
      completionResult.outcome === "completed"
        ? completionResult.coverageId
        : checkoutSession.coverageId,
    amountKobo: verifiedTransaction.amount,
    currency: checkoutSession.currency,
    transactionStatus: verifiedTransaction.status,
    signatureValid: options.signatureValid ?? null,
    processingOutcome: completionResult.outcome,
    payload: verificationPayload,
  });

  return completionResult;
}

export async function cancelPaystackCheckoutByReference(reference: string) {
  const checkoutSession = await prisma.propertyCheckoutSession.findUnique({
    where: { paystackReference: reference },
    select: {
      id: true,
      status: true,
    },
  });

  if (!checkoutSession || checkoutSession.status === "completed") {
    return false;
  }

  await prisma.propertyCheckoutSession.update({
    where: { id: checkoutSession.id },
    data: {
      status: "cancelled",
    },
  });

  return true;
}
