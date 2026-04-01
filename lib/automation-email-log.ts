import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendResendEmail } from "@/lib/resend";

export const AUTOMATION_EMAIL_EVENT_TYPES = {
  paymentSuccess: "payment_success",
  paymentFailure: "payment_failure",
  upcomingExpiryReminder: "upcoming_expiry_reminder",
  gracePeriodStarted: "grace_period_started",
  finalArchiveWarning: "final_archive_warning",
  archiveConfirmation: "archive_confirmation",
  restoreConfirmation: "restore_confirmation",
} as const;

type AutomationEmailEventType =
  (typeof AUTOMATION_EMAIL_EVENT_TYPES)[keyof typeof AUTOMATION_EMAIL_EVENT_TYPES];

type SendLoggedAutomationEmailInput = {
  dedupeKey: string;
  eventType: AutomationEmailEventType;
  recipientEmail: string;
  subject: string;
  text: string;
  html?: string;
  userId?: string | null;
  propertyId?: string | null;
  coverageId?: string | null;
  checkoutSessionId?: string | null;
};

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function acquireAutomationEmailLog(input: SendLoggedAutomationEmailInput) {
  const existingLog = await prisma.automationEmailLog.findUnique({
    where: { dedupeKey: input.dedupeKey },
  });

  if (existingLog) {
    if (existingLog.status === "sent" || existingLog.status === "processing") {
      return null;
    }

    return prisma.automationEmailLog.update({
      where: { id: existingLog.id },
      data: {
        status: "processing",
        recipientEmail: input.recipientEmail,
        subject: input.subject,
        errorMessage: null,
        failedAt: null,
        processingStartedAt: new Date(),
      },
    });
  }

  try {
    return await prisma.automationEmailLog.create({
      data: {
        id: randomUUID(),
        dedupeKey: input.dedupeKey,
        eventType: input.eventType,
        status: "processing",
        userId: input.userId ?? null,
        propertyId: input.propertyId ?? null,
        coverageId: input.coverageId ?? null,
        checkoutSessionId: input.checkoutSessionId ?? null,
        recipientEmail: input.recipientEmail,
        subject: input.subject,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return null;
    }

    throw error;
  }
}

export async function sendLoggedAutomationEmail(
  input: SendLoggedAutomationEmailInput,
) {
  const log = await acquireAutomationEmailLog(input);

  if (!log) {
    return {
      outcome: "skipped" as const,
    };
  }

  try {
    const result = await sendResendEmail({
      to: input.recipientEmail,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    await prisma.automationEmailLog.update({
      where: { id: log.id },
      data: {
        status: "sent",
        resendEmailId: result.id,
        sentAt: new Date(),
        errorMessage: null,
      },
    });

    return {
      outcome: "sent" as const,
      resendEmailId: result.id,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send automation email.";

    await prisma.automationEmailLog.update({
      where: { id: log.id },
      data: {
        status: "failed",
        failedAt: new Date(),
        errorMessage,
      },
    });

    throw error;
  }
}
