import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/app-url";
import {
  AUTOMATION_EMAIL_EVENT_TYPES,
  sendLoggedAutomationEmail,
} from "@/lib/automation-email-log";
import {
  safeCreateNotification,
  type CreateNotificationInput,
} from "@/lib/notifications";
import { formatNgnFromKobo } from "@/lib/property-plans";

const UPCOMING_EXPIRY_REMINDER_DAYS = 7;
const FINAL_ARCHIVE_WARNING_DAYS = 1;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function formatDate(value: Date | null) {
  if (!value) {
    return "No expiry";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

function formatDays(value: number) {
  return value === 1 ? "1 day" : `${value} days`;
}

function buildEmailBody(options: {
  title: string;
  intro: string;
  propertyName: string;
  serialNumber: string;
  detailLines: string[];
  actionLabel?: string;
  actionUrl?: string;
}) {
  const detailListText = options.detailLines.map((line) => `- ${line}`).join("\n");
  const actionSectionText =
    options.actionLabel && options.actionUrl
      ? `\n\n${options.actionLabel}: ${options.actionUrl}`
      : "";
  const text = [
    `Hello,`,
    ``,
    options.intro,
    ``,
    `Property: ${options.propertyName}`,
    `Serial number: ${options.serialNumber}`,
    detailListText,
    actionSectionText,
    ``,
    `Thank you,`,
    `Catcher`,
  ]
    .filter(Boolean)
    .join("\n");

  const detailListHtml = options.detailLines
    .map((line) => `<li style="margin-bottom:8px;">${line}</li>`)
    .join("");
  const actionHtml =
    options.actionLabel && options.actionUrl
      ? `<p style="margin-top:24px;"><a href="${options.actionUrl}" style="display:inline-block;background:#0F2651;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600;">${options.actionLabel}</a></p>`
      : "";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:640px;margin:0 auto;padding:24px;">
      <p>Hello,</p>
      <h1 style="font-size:24px;line-height:1.3;color:#0F2651;margin:0 0 16px;">${options.title}</h1>
      <p>${options.intro}</p>
      <div style="margin:24px 0;padding:18px;border:1px solid #e2e8f0;border-radius:20px;background:#f8fafc;">
        <p style="margin:0 0 8px;"><strong>Property:</strong> ${options.propertyName}</p>
        <p style="margin:0 0 16px;"><strong>Serial number:</strong> ${options.serialNumber}</p>
        <ul style="padding-left:20px;margin:0;">${detailListHtml}</ul>
      </div>
      ${actionHtml}
      <p style="margin-top:24px;">Thank you,<br />Catcher</p>
    </div>
  `;

  return {
    text,
    html,
  };
}

function getBillingUrl() {
  return `${getAppBaseUrl()}/dashboard/subscriptions`;
}

function getPropertiesUrl() {
  return `${getAppBaseUrl()}/dashboard/properties`;
}

async function sendBatchedNotification(
  tasks: Array<() => Promise<"sent" | "skipped">>,
) {
  let sent = 0;
  let skipped = 0;

  for (const task of tasks) {
    const outcome = await task();

    if (outcome === "sent") {
      sent += 1;
    } else {
      skipped += 1;
    }
  }

  return {
    sent,
    skipped,
  };
}

async function createNotificationFromAutomationResult(
  result: { outcome: "sent" | "skipped" },
  input: CreateNotificationInput,
) {
  if (result.outcome !== "sent") {
    return;
  }

  await safeCreateNotification(input);
}

export async function sendPaymentSuccessEmailForCheckoutSession(
  checkoutSessionId: string,
) {
  const checkoutSession = await prisma.propertyCheckoutSession.findUnique({
    where: { id: checkoutSessionId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
      property: {
        select: {
          id: true,
          name: true,
          serialNumber: true,
        },
      },
      coverage: {
        select: {
          id: true,
          planName: true,
          priceNgnKobo: true,
          startsAt: true,
          expiresAt: true,
        },
      },
    },
  });

  if (
    !checkoutSession ||
    !checkoutSession.paystackReference ||
    !checkoutSession.property ||
    !checkoutSession.coverage
  ) {
    return { outcome: "skipped" as const };
  }

  const content = buildEmailBody({
    title: `Payment confirmed for ${checkoutSession.property.name}`,
    intro:
      "Your Catcher payment has been confirmed, and the property plan is now active on your account.",
    propertyName: checkoutSession.property.name,
    serialNumber: checkoutSession.property.serialNumber,
    detailLines: [
      `Plan: ${checkoutSession.coverage.planName}`,
      `Amount: ${formatNgnFromKobo(checkoutSession.coverage.priceNgnKobo)}`,
      `Coverage starts: ${formatDate(checkoutSession.coverage.startsAt)}`,
      `Coverage ends: ${formatDate(checkoutSession.coverage.expiresAt)}`,
    ],
    actionLabel: "Manage property plans",
    actionUrl: getBillingUrl(),
  });

  const result = await sendLoggedAutomationEmail({
    dedupeKey: `payment-success:${checkoutSession.id}`,
    eventType: AUTOMATION_EMAIL_EVENT_TYPES.paymentSuccess,
    recipientEmail: checkoutSession.user.email,
    subject: `Payment confirmed for ${checkoutSession.property.name}`,
    text: content.text,
    html: content.html,
    userId: checkoutSession.user.id,
    propertyId: checkoutSession.property.id,
    coverageId: checkoutSession.coverage.id,
    checkoutSessionId: checkoutSession.id,
  });

  return result;
}

export async function sendPaymentFailureEmailForCheckoutSession(
  checkoutSessionId: string,
  failureStatus: string,
) {
  const checkoutSession = await prisma.propertyCheckoutSession.findUnique({
    where: { id: checkoutSessionId },
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
    return { outcome: "skipped" as const };
  }

  const content = buildEmailBody({
    title: `Payment could not be confirmed for ${checkoutSession.name}`,
    intro:
      "We could not confirm the Paystack payment for your property plan, so Catcher did not activate the coverage.",
    propertyName: checkoutSession.name,
    serialNumber: checkoutSession.serialNumber,
    detailLines: [
      `Attempted plan: ${checkoutSession.planName}`,
      `Attempted amount: ${formatNgnFromKobo(checkoutSession.priceNgnKobo)}`,
      `Paystack status: ${failureStatus}`,
    ],
    actionLabel: "Try the plan again",
    actionUrl: getBillingUrl(),
  });

  const result = await sendLoggedAutomationEmail({
    dedupeKey: `payment-failure:${checkoutSession.id}`,
    eventType: AUTOMATION_EMAIL_EVENT_TYPES.paymentFailure,
    recipientEmail: checkoutSession.user.email,
    subject: `Payment could not be confirmed for ${checkoutSession.name}`,
    text: content.text,
    html: content.html,
    userId: checkoutSession.user.id,
    propertyId: checkoutSession.propertyId,
    coverageId: checkoutSession.coverageId,
    checkoutSessionId: checkoutSession.id,
  });

  return result;
}

export async function sendRestoreConfirmationEmailForCheckoutSession(
  checkoutSessionId: string,
) {
  const checkoutSession = await prisma.propertyCheckoutSession.findUnique({
    where: { id: checkoutSessionId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
      property: {
        select: {
          id: true,
          name: true,
          serialNumber: true,
        },
      },
      coverage: {
        select: {
          id: true,
          planName: true,
          startsAt: true,
          expiresAt: true,
          renewedFrom: {
            select: {
              id: true,
              archivedAt: true,
            },
          },
        },
      },
    },
  });

  if (
    !checkoutSession ||
    !checkoutSession.property ||
    !checkoutSession.coverage?.renewedFrom?.archivedAt
  ) {
    return { outcome: "skipped" as const };
  }

  const content = buildEmailBody({
    title: `${checkoutSession.property.name} has been restored`,
    intro:
      "Your archived Catcher property has been restored after successful renewal, and it is back in your protected records.",
    propertyName: checkoutSession.property.name,
    serialNumber: checkoutSession.property.serialNumber,
    detailLines: [
      `Restored plan: ${checkoutSession.coverage.planName}`,
      `Coverage restarts: ${formatDate(checkoutSession.coverage.startsAt)}`,
      `Coverage ends: ${formatDate(checkoutSession.coverage.expiresAt)}`,
    ],
    actionLabel: "Open your properties",
    actionUrl: getPropertiesUrl(),
  });

  const result = await sendLoggedAutomationEmail({
    dedupeKey: `restore-confirmation:${checkoutSession.coverage.id}`,
    eventType: AUTOMATION_EMAIL_EVENT_TYPES.restoreConfirmation,
    recipientEmail: checkoutSession.user.email,
    subject: `${checkoutSession.property.name} has been restored`,
    text: content.text,
    html: content.html,
    userId: checkoutSession.user.id,
    propertyId: checkoutSession.property.id,
    coverageId: checkoutSession.coverage.id,
    checkoutSessionId: checkoutSession.id,
  });

  return result;
}

export async function sendUpcomingExpiryReminderEmails(now = new Date()) {
  const reminderCutoff = new Date(
    now.getTime() + UPCOMING_EXPIRY_REMINDER_DAYS * DAY_IN_MILLISECONDS,
  );
  const coverages = await prisma.propertyCoverage.findMany({
    where: {
      planCode: { in: ["monthly", "yearly"] },
      status: "active",
      expiresAt: {
        gt: now,
        lte: reminderCutoff,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
      property: {
        select: {
          id: true,
          name: true,
          serialNumber: true,
          archivedAt: true,
        },
      },
      renewals: {
        where: {
          status: { in: ["scheduled", "active", "grace"] },
        },
        select: { id: true },
        take: 1,
      },
    },
  });

  return sendBatchedNotification(
    coverages
      .filter((coverage) => !coverage.property.archivedAt && coverage.renewals.length === 0)
      .map((coverage) => async () => {
        const content = buildEmailBody({
          title: `${coverage.property.name} expires soon`,
          intro:
            "Your Catcher property plan is approaching expiry. Renew early to extend from the current expiry date without creating a duplicate property.",
          propertyName: coverage.property.name,
          serialNumber: coverage.property.serialNumber,
          detailLines: [
            `Current plan: ${coverage.planName}`,
            `Current amount: ${formatNgnFromKobo(coverage.priceNgnKobo)}`,
            `Expiry date: ${formatDate(coverage.expiresAt)}`,
          ],
          actionLabel: "Renew this property plan",
          actionUrl: getBillingUrl(),
        });

        const result = await sendLoggedAutomationEmail({
          dedupeKey: `upcoming-expiry:${coverage.id}`,
          eventType: AUTOMATION_EMAIL_EVENT_TYPES.upcomingExpiryReminder,
          recipientEmail: coverage.user.email,
          subject: `${coverage.property.name} expires soon`,
          text: content.text,
          html: content.html,
          userId: coverage.user.id,
          propertyId: coverage.property.id,
          coverageId: coverage.id,
        });

        await createNotificationFromAutomationResult(result, {
          userId: coverage.user.id,
          type: "CoverageExpiring",
          title: `${coverage.property.name} expires soon`,
          message: `Your ${coverage.planName} subscription expires on ${formatDate(coverage.expiresAt)}. Renew early to extend coverage from the current expiry date.`,
          linkPath: "/dashboard/subscriptions",
          propertyId: coverage.property.id,
          coverageId: coverage.id,
          payload: {
            reminderType: "upcoming_expiry",
            expiresAt: coverage.expiresAt?.toISOString() ?? null,
          },
        });

        return result.outcome === "sent" ? "sent" : "skipped";
      }),
  );
}

export async function sendGracePeriodStartedEmails(now = new Date()) {
  const coverages = await prisma.propertyCoverage.findMany({
    where: {
      status: "grace",
      graceEndsAt: {
        gt: now,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
      property: {
        select: {
          id: true,
          name: true,
          serialNumber: true,
        },
      },
    },
  });

  return sendBatchedNotification(
    coverages.map((coverage) => async () => {
      const content = buildEmailBody({
        title: `${coverage.property.name} is now in its grace period`,
        intro:
          "Your property plan has expired and has now entered the 7-day grace period. Renew before the grace window ends to keep the same property record live on Catcher.",
        propertyName: coverage.property.name,
        serialNumber: coverage.property.serialNumber,
        detailLines: [
          `Expired on: ${formatDate(coverage.expiresAt)}`,
          `Grace ends: ${formatDate(coverage.graceEndsAt)}`,
        ],
        actionLabel: "Renew now",
        actionUrl: getBillingUrl(),
      });

      const result = await sendLoggedAutomationEmail({
        dedupeKey: `grace-period-started:${coverage.id}`,
        eventType: AUTOMATION_EMAIL_EVENT_TYPES.gracePeriodStarted,
        recipientEmail: coverage.user.email,
        subject: `${coverage.property.name} is now in its grace period`,
        text: content.text,
        html: content.html,
        userId: coverage.user.id,
        propertyId: coverage.property.id,
        coverageId: coverage.id,
      });

      await createNotificationFromAutomationResult(result, {
        userId: coverage.user.id,
        type: "GraceStarted",
        title: `${coverage.property.name} is in grace`,
        message: `This property is now in its 7-day grace period. Renew before ${formatDate(coverage.graceEndsAt)} to keep it live.`,
        linkPath: "/dashboard/subscriptions",
        propertyId: coverage.property.id,
        coverageId: coverage.id,
        payload: {
          expiresAt: coverage.expiresAt?.toISOString() ?? null,
          graceEndsAt: coverage.graceEndsAt?.toISOString() ?? null,
        },
      });

      return result.outcome === "sent" ? "sent" : "skipped";
    }),
  );
}

export async function sendFinalArchiveWarningEmails(now = new Date()) {
  const warningCutoff = new Date(
    now.getTime() + FINAL_ARCHIVE_WARNING_DAYS * DAY_IN_MILLISECONDS,
  );
  const coverages = await prisma.propertyCoverage.findMany({
    where: {
      status: "grace",
      graceEndsAt: {
        gt: now,
        lte: warningCutoff,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
      property: {
        select: {
          id: true,
          name: true,
          serialNumber: true,
        },
      },
      renewals: {
        where: {
          status: { in: ["scheduled", "active", "grace"] },
        },
        select: { id: true },
        take: 1,
      },
    },
  });

  return sendBatchedNotification(
    coverages
      .filter((coverage) => coverage.renewals.length === 0)
      .map((coverage) => async () => {
        const daysLeft = Math.max(
          1,
          Math.ceil(
            ((coverage.graceEndsAt?.getTime() ?? now.getTime()) - now.getTime()) /
              DAY_IN_MILLISECONDS,
          ),
        );
        const content = buildEmailBody({
          title: `${coverage.property.name} is close to archive`,
          intro:
            "Your Catcher grace window is almost over. If you do not renew before the deadline, the property will be soft-archived and hidden from normal dashboard actions until you restore it.",
          propertyName: coverage.property.name,
          serialNumber: coverage.property.serialNumber,
          detailLines: [
            `Grace ends: ${formatDate(coverage.graceEndsAt)}`,
            `Time left: ${formatDays(daysLeft)}`,
          ],
          actionLabel: "Renew before archive",
          actionUrl: getBillingUrl(),
        });

        const result = await sendLoggedAutomationEmail({
          dedupeKey: `final-archive-warning:${coverage.id}`,
          eventType: AUTOMATION_EMAIL_EVENT_TYPES.finalArchiveWarning,
          recipientEmail: coverage.user.email,
          subject: `${coverage.property.name} is close to archive`,
          text: content.text,
          html: content.html,
          userId: coverage.user.id,
          propertyId: coverage.property.id,
          coverageId: coverage.id,
        });

        await createNotificationFromAutomationResult(result, {
          userId: coverage.user.id,
          type: "CoverageExpiring",
          title: `${coverage.property.name} is close to archive`,
          message: `Final warning: the grace period ends on ${formatDate(coverage.graceEndsAt)}. Renew now to avoid archive.`,
          linkPath: "/dashboard/subscriptions",
          propertyId: coverage.property.id,
          coverageId: coverage.id,
          payload: {
            reminderType: "final_archive_warning",
            graceEndsAt: coverage.graceEndsAt?.toISOString() ?? null,
            daysLeft,
          },
        });

        return result.outcome === "sent" ? "sent" : "skipped";
      }),
  );
}

export async function sendArchiveConfirmationEmails() {
  const properties = await prisma.property.findMany({
    where: {
      archivedAt: {
        not: null,
      },
      restorable: true,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
      coverages: {
        where: {
          status: "archived",
        },
        orderBy: [{ archivedAt: "desc" }, { updatedAt: "desc" }],
        take: 1,
      },
    },
  });

  return sendBatchedNotification(
    properties
      .filter((property) => property.coverages.length > 0)
      .map((property) => async () => {
        const coverage = property.coverages[0];
        const content = buildEmailBody({
          title: `${property.name} has been archived`,
          intro:
            "The property plan grace window ended, so Catcher has soft-archived the property. It is now hidden from normal dashboard actions until you renew it.",
          propertyName: property.name,
          serialNumber: property.serialNumber,
          detailLines: [
            `Archived on: ${formatDate(property.archivedAt)}`,
            `Last active plan: ${coverage.planName}`,
          ],
          actionLabel: "Restore this property",
          actionUrl: getBillingUrl(),
        });

        const result = await sendLoggedAutomationEmail({
          dedupeKey: `archive-confirmation:${coverage.id}`,
          eventType: AUTOMATION_EMAIL_EVENT_TYPES.archiveConfirmation,
          recipientEmail: property.user.email,
          subject: `${property.name} has been archived`,
          text: content.text,
          html: content.html,
          userId: property.user.id,
          propertyId: property.id,
          coverageId: coverage.id,
        });

        await createNotificationFromAutomationResult(result, {
          userId: property.user.id,
          type: "PropertyArchived",
          title: `${property.name} has been archived`,
          message:
            "The grace period ended, so this property is now archived and hidden from normal dashboard actions until renewal.",
          linkPath: "/dashboard/subscriptions",
          propertyId: property.id,
          coverageId: coverage.id,
          payload: {
            archivedAt: property.archivedAt?.toISOString() ?? null,
            planName: coverage.planName,
          },
        });

        return result.outcome === "sent" ? "sent" : "skipped";
      }),
  );
}

export async function sendRestoreConfirmationFollowUpEmails() {
  const checkoutSessions = await prisma.propertyCheckoutSession.findMany({
    where: {
      status: "completed",
      coverageId: {
        not: null,
      },
      propertyId: {
        not: null,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
      property: {
        select: {
          id: true,
          name: true,
          serialNumber: true,
          archivedAt: true,
        },
      },
      coverage: {
        select: {
          id: true,
          planName: true,
          startsAt: true,
          expiresAt: true,
          renewedFrom: {
            select: {
              archivedAt: true,
            },
          },
        },
      },
    },
    orderBy: { completedAt: "desc" },
    take: 100,
  });

  return sendBatchedNotification(
    checkoutSessions
      .filter(
        (checkoutSession) =>
          checkoutSession.property &&
          checkoutSession.property.archivedAt === null &&
          checkoutSession.coverage?.renewedFrom?.archivedAt,
      )
      .map((checkoutSession) => async () => {
        const coverage = checkoutSession.coverage!;
        const property = checkoutSession.property!;
        const content = buildEmailBody({
          title: `${property.name} has been restored`,
          intro:
            "Your renewal has restored this archived property, and it is active in Catcher again.",
          propertyName: property.name,
          serialNumber: property.serialNumber,
          detailLines: [
            `Restored plan: ${coverage.planName}`,
            `Coverage restarts: ${formatDate(coverage.startsAt)}`,
            `Coverage ends: ${formatDate(coverage.expiresAt)}`,
          ],
          actionLabel: "Open your properties",
          actionUrl: getPropertiesUrl(),
        });

        const result = await sendLoggedAutomationEmail({
          dedupeKey: `restore-confirmation:${coverage.id}`,
          eventType: AUTOMATION_EMAIL_EVENT_TYPES.restoreConfirmation,
          recipientEmail: checkoutSession.user.email,
          subject: `${property.name} has been restored`,
          text: content.text,
          html: content.html,
          userId: checkoutSession.user.id,
          propertyId: property.id,
          coverageId: coverage.id,
          checkoutSessionId: checkoutSession.id,
        });

        return result.outcome === "sent" ? "sent" : "skipped";
      }),
  );
}
