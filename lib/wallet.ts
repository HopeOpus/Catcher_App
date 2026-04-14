import { randomUUID } from "node:crypto";
import { NotificationType, Prisma, type PrismaClient } from "@prisma/client";
import { ensureReferralProfile, getNextReferralMilestone, buildReferralLinks } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";
import { safeCreateNotification } from "@/lib/notifications";

export const WALLET_EXPIRING_SOON_WINDOW_DAYS = 30;
export const WALLET_TRANSFER_MIN_CREDITS = 1;
export const WALLET_TRANSFER_MAX_CREDITS = 500;
export const WALLET_TRANSFER_DAILY_LIMIT_CREDITS = 1000;
export const NGN_KOBO_PER_WALLET_CREDIT = 100;
const LAGOS_UTC_OFFSET_MS = 60 * 60 * 1000;
const MAX_WALLET_RETRY_ATTEMPTS = 3;
const WALLET_EXPIRING_SOON_NOTIFICATION_COOLDOWN_DAYS = 7;
type WalletReadClient =
  | Pick<PrismaClient, "wallet" | "walletTransaction" | "referralProfile" | "referralRelationship" | "user" | "notification">
  | Pick<Prisma.TransactionClient, "wallet" | "walletTransaction" | "referralProfile" | "referralRelationship" | "user" | "notification">;

type WalletRootClient = Pick<
  PrismaClient,
  "$transaction" | "wallet" | "walletTransaction" | "referralProfile" | "referralRelationship" | "user" | "notification"
>;

type WalletTransactionRow = {
  id: string;
  walletId: string;
  userId: string;
  type: string;
  direction: string;
  amountCredits: number;
  balanceAfterCredits: number;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  expiresAt: Date | null;
  expiredFromTransactionId: string | null;
  createdAt: Date;
  metadata: Prisma.JsonValue | null;
};

type WalletCreditLot = {
  sourceTransactionId: string;
  walletId: string;
  userId: string;
  type: string;
  createdAt: Date;
  expiresAt: Date | null;
  originalAmountCredits: number;
  remainingCredits: number;
};

export type WalletConsumedLot = {
  sourceTransactionId: string;
  amountCredits: number;
  expiresAt: string | null;
  sourceType: string;
};

function hasTransactionCapability(db: WalletReadClient | WalletRootClient): db is WalletRootClient {
  return "$transaction" in db;
}

function isRetryableSerializationError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

function compareLotsByConsumptionOrder(a: WalletCreditLot, b: WalletCreditLot) {
  if (a.createdAt.getTime() !== b.createdAt.getTime()) {
    return a.createdAt.getTime() - b.createdAt.getTime();
  }

  if (a.expiresAt && b.expiresAt && a.expiresAt.getTime() !== b.expiresAt.getTime()) {
    return a.expiresAt.getTime() - b.expiresAt.getTime();
  }

  if (a.expiresAt && !b.expiresAt) {
    return -1;
  }

  if (!a.expiresAt && b.expiresAt) {
    return 1;
  }

  return a.sourceTransactionId.localeCompare(b.sourceTransactionId);
}

function sumCredits(values: Array<{ amountCredits: number }> | Array<{ remainingCredits: number }>) {
  return values.reduce((sum, value) => {
    if ("amountCredits" in value) {
      return sum + value.amountCredits;
    }

    return sum + value.remainingCredits;
  }, 0);
}

function buildCreditExpiryDate(from: Date) {
  const expiresAt = new Date(from);
  expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1);
  return expiresAt;
}


function getLagosDayBounds(date: Date) {
  const dayMs = 24 * 60 * 60 * 1000;
  const shifted = date.getTime() + LAGOS_UTC_OFFSET_MS;
  const start = new Date(Math.floor(shifted / dayMs) * dayMs - LAGOS_UTC_OFFSET_MS);
  const end = new Date(start.getTime() + dayMs);
  return { start, end };
}

function subtractUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() - days);
  return next;
}

async function maybeCreateCreditsExpiringSoonNotification(
  input: {
    userId: string;
    walletId: string;
    scheduledExpiringCredits: number;
    expiringWindowDays: number;
    asOf?: Date;
  },
  db: WalletReadClient | WalletRootClient = prisma,
) {
  if (input.scheduledExpiringCredits <= 0) {
    return;
  }

  const asOf = input.asOf ?? new Date();
  const existingReminder = await db.notification.findFirst({
    where: {
      userId: input.userId,
      type: NotificationType.CreditsExpiringSoon,
      createdAt: {
        gte: subtractUtcDays(asOf, WALLET_EXPIRING_SOON_NOTIFICATION_COOLDOWN_DAYS),
      },
    },
    select: {
      id: true,
    },
  });

  if (existingReminder) {
    return;
  }

  await safeCreateNotification(
    {
      userId: input.userId,
      type: NotificationType.CreditsExpiringSoon,
      title: "Credits expiring soon",
      message: `${input.scheduledExpiringCredits} Catcher Security Credit${input.scheduledExpiringCredits === 1 ? " is" : "s are"} set to expire within ${input.expiringWindowDays} days if left unused.`,
      payload: {
        walletId: input.walletId,
        scheduledExpiringCredits: input.scheduledExpiringCredits,
        expiringWindowDays: input.expiringWindowDays,
        targetMobileRoute: "/wallet",
      },
    },
    db,
  );
}

async function getTransferredCreditsForLagosDay(
  db: Pick<Prisma.TransactionClient, "walletTransaction">,
  userId: string,
  date: Date,
) {
  const { start, end } = getLagosDayBounds(date);
  const aggregate = await db.walletTransaction.aggregate({
    where: {
      userId,
      type: "giftSent",
      createdAt: {
        gte: start,
        lt: end,
      },
    },
    _sum: {
      amountCredits: true,
    },
  });

  return {
    usedCredits: aggregate._sum.amountCredits ?? 0,
    windowStart: start,
    windowEnd: end,
  };
}

export function convertNgnKoboToWalletCredits(amountKobo: number) {
  if (!Number.isFinite(amountKobo) || amountKobo <= 0) {
    return 0;
  }

  return Math.ceil(amountKobo / NGN_KOBO_PER_WALLET_CREDIT);
}

export function normalizeWalletTransferNote(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized.slice(0, 255) : null;
}

export function serializeWalletTransaction(transaction: {
  id: string;
  type: string;
  direction: string;
  amountCredits: number;
  balanceAfterCredits: number;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  metadata: Prisma.JsonValue | null;
}) {
  return {
    id: transaction.id,
    type: transaction.type,
    direction: transaction.direction,
    amountCredits: transaction.amountCredits,
    balanceAfterCredits: transaction.balanceAfterCredits,
    description: transaction.description,
    referenceType: transaction.referenceType,
    referenceId: transaction.referenceId,
    expiresAt: transaction.expiresAt?.toISOString() ?? null,
    createdAt: transaction.createdAt.toISOString(),
    metadata: transaction.metadata ?? null,
  };
}

async function loadWalletTransactions(db: WalletReadClient, userId: string) {
  return db.walletTransaction.findMany({
    where: { userId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      walletId: true,
      userId: true,
      type: true,
      direction: true,
      amountCredits: true,
      balanceAfterCredits: true,
      description: true,
      referenceType: true,
      referenceId: true,
      expiresAt: true,
      expiredFromTransactionId: true,
      createdAt: true,
      metadata: true,
    },
  });
}

function buildWalletLedgerState(transactions: WalletTransactionRow[], asOf: Date) {
  const lots: WalletCreditLot[] = [];

  for (const transaction of transactions) {
    if (transaction.direction === "credit") {
      lots.push({
        sourceTransactionId: transaction.id,
        walletId: transaction.walletId,
        userId: transaction.userId,
        type: transaction.type,
        createdAt: transaction.createdAt,
        expiresAt: transaction.expiresAt,
        originalAmountCredits: transaction.amountCredits,
        remainingCredits: transaction.amountCredits,
      });
      continue;
    }

    let remainingDebit = transaction.amountCredits;

    if (transaction.type === "expiryDebit" && transaction.expiredFromTransactionId) {
      const sourceLot = lots.find(
        (lot) => lot.sourceTransactionId === transaction.expiredFromTransactionId,
      );

      if (sourceLot) {
        const applied = Math.min(sourceLot.remainingCredits, remainingDebit);
        sourceLot.remainingCredits -= applied;
        remainingDebit -= applied;
      }
    }

    if (remainingDebit <= 0) {
      continue;
    }

    const eligibleLots = lots
      .filter(
        (lot) =>
          lot.remainingCredits > 0 &&
          (lot.expiresAt === null || lot.expiresAt.getTime() > transaction.createdAt.getTime()),
      )
      .sort(compareLotsByConsumptionOrder);

    for (const lot of eligibleLots) {
      if (remainingDebit <= 0) {
        break;
      }

      const applied = Math.min(lot.remainingCredits, remainingDebit);
      lot.remainingCredits -= applied;
      remainingDebit -= applied;
    }
  }

  const expiringSoonCutoff = new Date(
    asOf.getTime() + WALLET_EXPIRING_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  const availableLots = lots.filter(
    (lot) => lot.remainingCredits > 0 && (lot.expiresAt === null || lot.expiresAt.getTime() > asOf.getTime()),
  );
  const expiredLots = lots.filter(
    (lot) => lot.remainingCredits > 0 && lot.expiresAt !== null && lot.expiresAt.getTime() <= asOf.getTime(),
  );
  const expiringSoonLots = availableLots.filter(
    (lot) => lot.expiresAt !== null && lot.expiresAt.getTime() <= expiringSoonCutoff.getTime(),
  );

  return {
    lots,
    availableLots: [...availableLots].sort(compareLotsByConsumptionOrder),
    expiredLots: [...expiredLots].sort(compareLotsByConsumptionOrder),
    availableBalanceCredits: sumCredits(availableLots),
    expiredBalanceCredits: sumCredits(expiredLots),
    scheduledExpiringCredits: sumCredits(expiringSoonLots),
  };
}

async function withWalletRetry<T>(db: WalletRootClient, action: (tx: Prisma.TransactionClient) => Promise<T>) {
  for (let attempt = 0; attempt < MAX_WALLET_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await db.$transaction(
        async (tx) => action(tx),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      if (!isRetryableSerializationError(error) || attempt === MAX_WALLET_RETRY_ATTEMPTS - 1) {
        throw error;
      }
    }
  }

  throw new Error("Unable to complete the wallet operation right now.");
}

export async function ensureWallet(db: WalletReadClient, userId: string) {
  const existing = await db.wallet.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing;
  }

  try {
    return await db.wallet.create({
      data: {
        id: randomUUID(),
        userId,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const wallet = await db.wallet.findUnique({ where: { userId } });
      if (wallet) {
        return wallet;
      }
    }

    throw error;
  }
}

async function settleExpiredWalletCreditsInTransaction(
  tx: Prisma.TransactionClient,
  userId: string,
  asOf: Date,
) {
  const wallet = await ensureWallet(tx, userId);
  const transactions = await loadWalletTransactions(tx, userId);
  const ledger = buildWalletLedgerState(transactions, asOf);

  if (ledger.expiredLots.length === 0) {
    return {
      expiredCredits: 0,
      expiredLots: [] as WalletCreditLot[],
      wallet,
    };
  }

  const totalExpiredCredits = ledger.expiredBalanceCredits;
  const walletUpdate = await tx.wallet.updateMany({
    where: {
      id: wallet.id,
      balanceCredits: {
        gte: totalExpiredCredits,
      },
    },
    data: {
      balanceCredits: { decrement: totalExpiredCredits },
      lifetimeExpiredCredits: { increment: totalExpiredCredits },
    },
  });

  if (walletUpdate.count === 0) {
    throw new Error("Wallet balance is out of sync. Please retry this wallet action.");
  }

  const updatedWallet = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
  let runningBalance = updatedWallet.balanceCredits + totalExpiredCredits;

  await tx.walletTransaction.createMany({
    data: ledger.expiredLots.map((lot) => {
      runningBalance -= lot.remainingCredits;
      return {
        id: randomUUID(),
        walletId: wallet.id,
        userId,
        type: "expiryDebit",
        direction: "debit",
        amountCredits: lot.remainingCredits,
        balanceAfterCredits: runningBalance,
        description: "Expired unused Catcher Security Credit.",
        referenceType: "wallet_expiry",
        referenceId: lot.sourceTransactionId,
        expiredFromTransactionId: lot.sourceTransactionId,
        metadata: {
          sourceTransactionId: lot.sourceTransactionId,
          sourceTransactionType: lot.type,
          originalEarnedAt: lot.createdAt.toISOString(),
          originalExpiresAt: lot.expiresAt?.toISOString() ?? null,
          expiredAt: asOf.toISOString(),
        },
      };
    }),
  });

  return {
    expiredCredits: totalExpiredCredits,
    expiredLots: ledger.expiredLots,
    wallet: updatedWallet,
  };
}

export async function settleExpiredWalletCredits(
  userId: string,
  db: WalletRootClient = prisma,
  asOf: Date = new Date(),
) {
  const result = await withWalletRetry(db, (tx) => settleExpiredWalletCreditsInTransaction(tx, userId, asOf));

  if (result.expiredCredits > 0) {
    await safeCreateNotification(
      {
        userId,
        type: NotificationType.CreditsExpired,
        title: "Unused credits have expired",
        message: `${result.expiredCredits} Catcher Security Credit${result.expiredCredits === 1 ? " has" : "s have"} expired after 12 months of inactivity.`,
        payload: {
          expiredCredits: result.expiredCredits,
          expiredLotCount: result.expiredLots.length,
          expiredSourceTransactionIds: result.expiredLots.map((lot) => lot.sourceTransactionId),
          targetMobileRoute: "/wallet/transactions",
        },
      },
      db,
    );
  }

  return result;
}

async function consumeWalletCreditsInTransaction(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    amountCredits: number;
    type: "giftSent" | "registrationSpend" | "premiumFeatureSpend" | "theftAlertBoostSpend" | "adminAdjustment";
    description: string;
    referenceType: string;
    referenceId: string;
    note?: string | null;
    metadata?: Record<string, Prisma.JsonValue>;
    spentCounterField?: "lifetimeSpentCredits" | "lifetimeTransferredOutCredits";
    consumedAt?: Date;
  },
) {
  const consumedAt = input.consumedAt ?? new Date();
  const wallet = await ensureWallet(tx, input.userId);
  await settleExpiredWalletCreditsInTransaction(tx, input.userId, consumedAt);

  const transactions = await loadWalletTransactions(tx, input.userId);
  const ledger = buildWalletLedgerState(transactions, consumedAt);

  if (ledger.availableBalanceCredits < input.amountCredits) {
    throw new Error("Insufficient available credits for this transfer.");
  }

  let remaining = input.amountCredits;
  const consumedLots: WalletConsumedLot[] = [];

  for (const lot of ledger.availableLots) {
    if (remaining <= 0) {
      break;
    }

    const applied = Math.min(lot.remainingCredits, remaining);
    if (applied <= 0) {
      continue;
    }

    consumedLots.push({
      sourceTransactionId: lot.sourceTransactionId,
      amountCredits: applied,
      expiresAt: lot.expiresAt?.toISOString() ?? null,
      sourceType: lot.type,
    });
    remaining -= applied;
  }

  if (remaining > 0) {
    throw new Error("Insufficient available credits for this transfer.");
  }

  const walletUpdateData: Prisma.WalletUpdateInput = {
    balanceCredits: { decrement: input.amountCredits },
  };

  if (input.spentCounterField === "lifetimeSpentCredits") {
    walletUpdateData.lifetimeSpentCredits = { increment: input.amountCredits };
  }

  if (input.spentCounterField === "lifetimeTransferredOutCredits") {
    walletUpdateData.lifetimeTransferredOutCredits = { increment: input.amountCredits };
  }

  const walletUpdate = await tx.wallet.updateMany({
    where: {
      id: wallet.id,
      balanceCredits: {
        gte: input.amountCredits,
      },
    },
    data: walletUpdateData,
  });

  if (walletUpdate.count === 0) {
    throw new Error("Insufficient available credits for this transfer.");
  }

  const updatedWallet = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });

  const debitTransaction = await tx.walletTransaction.create({
    data: {
      id: randomUUID(),
      walletId: wallet.id,
      userId: input.userId,
      type: input.type,
      direction: "debit",
      amountCredits: input.amountCredits,
      balanceAfterCredits: updatedWallet.balanceCredits,
      description: input.description,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      metadata: {
        ...(input.metadata ?? {}),
        note: input.note ?? null,
        consumedLots,
        consumedAt: consumedAt.toISOString(),
      },
    },
  });

  return {
    wallet: updatedWallet,
    transaction: debitTransaction,
    consumedLots,
  };
}

export async function spendWalletCredits(
  input: {
    userId: string;
    amountCredits: number;
    type: "giftSent" | "registrationSpend" | "premiumFeatureSpend" | "theftAlertBoostSpend" | "adminAdjustment";
    description: string;
    referenceType: string;
    referenceId: string;
    note?: string | null;
    metadata?: Record<string, Prisma.JsonValue>;
    spentCounterField?: "lifetimeSpentCredits" | "lifetimeTransferredOutCredits";
    consumedAt?: Date;
  },
  db: WalletRootClient = prisma,
) {
  const amountCredits = Math.trunc(input.amountCredits);
  if (!Number.isFinite(amountCredits) || amountCredits <= 0) {
    throw new Error("Credit spend amount must be a positive whole number of credits.");
  }

  return withWalletRetry(db, async (tx) =>
    consumeWalletCreditsInTransaction(tx, {
      ...input,
      amountCredits,
    }),
  );
}

export async function refundWalletSpend(
  input: {
    userId: string;
    type: "registrationRefund" | "transferReversal" | "manualGrant";
    consumedLots: WalletConsumedLot[];
    description: string;
    referenceType: string;
    referenceId: string;
    metadata?: Record<string, Prisma.JsonValue>;
    refundedAt?: Date;
    decrementSpentCredits?: boolean;
    decrementTransferredOutCredits?: boolean;
  },
  db: WalletRootClient = prisma,
) {
  const refundableLots = input.consumedLots.filter((lot) => lot.amountCredits > 0);
  const totalCredits = refundableLots.reduce((sum, lot) => sum + lot.amountCredits, 0);

  if (totalCredits <= 0) {
    throw new Error("Refund amount must be a positive whole number of credits.");
  }

  return withWalletRetry(db, async (tx) => {
    const wallet = await ensureWallet(tx, input.userId);
    const refundedAt = input.refundedAt ?? new Date();
    const walletData: Prisma.WalletUpdateInput = {
      balanceCredits: { increment: totalCredits },
    };

    if (input.decrementSpentCredits) {
      walletData.lifetimeSpentCredits = { decrement: totalCredits };
    }

    if (input.decrementTransferredOutCredits) {
      walletData.lifetimeTransferredOutCredits = { decrement: totalCredits };
    }

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: walletData,
    });

    let runningBalance = updatedWallet.balanceCredits - totalCredits;
    await tx.walletTransaction.createMany({
      data: refundableLots.map((lot) => {
        runningBalance += lot.amountCredits;
        return {
          id: randomUUID(),
          walletId: wallet.id,
          userId: input.userId,
          type: input.type,
          direction: "credit",
          amountCredits: lot.amountCredits,
          balanceAfterCredits: runningBalance,
          description: input.description,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          expiresAt: lot.expiresAt ? new Date(lot.expiresAt) : null,
          metadata: {
            ...(input.metadata ?? {}),
            refundedAt: refundedAt.toISOString(),
            refundedSourceTransactionId: lot.sourceTransactionId,
            refundedSourceType: lot.sourceType,
          },
          createdAt: refundedAt,
        };
      }),
    });

    return {
      wallet: updatedWallet,
      refundedCredits: totalCredits,
    };
  });
}

export async function buildWalletSummary(userId: string, db: WalletReadClient | WalletRootClient = prisma) {
  if (hasTransactionCapability(db)) {
    await settleExpiredWalletCredits(userId, db);
  }

  const now = new Date();
  const [wallet, referralProfile, referralSource, transactions] = await Promise.all([
    ensureWallet(db, userId),
    ensureReferralProfile(db, userId),
    db.referralRelationship.findUnique({
      where: { referredUserId: userId },
      select: {
        id: true,
        referrerUserId: true,
        referralCodeUsed: true,
        status: true,
        fraudReviewStatus: true,
        fraudReviewReason: true,
        attachedAt: true,
        qualifiedAt: true,
        rewardedAt: true,
      },
    }),
    loadWalletTransactions(db, userId),
  ]);

  const ledger = buildWalletLedgerState(transactions, now);
  const links = buildReferralLinks(referralProfile.referralCode);
  const badgeAwardedAt = referralProfile.ambassadorBadgeAwardedAt?.toISOString() ?? null;
  const lastTransaction = transactions[transactions.length - 1] ?? null;

  const summary = {
    wallet: {
      walletId: wallet.id,
      currentBalanceCredits: wallet.balanceCredits,
      availableBalanceCredits: ledger.availableBalanceCredits,
      pendingBalanceCredits: 0,
      scheduledExpiringCredits: ledger.scheduledExpiringCredits,
      expiringWindowDays: WALLET_EXPIRING_SOON_WINDOW_DAYS,
      lifetimeEarnedCredits: wallet.lifetimeEarnedCredits,
      lifetimeSpentCredits: wallet.lifetimeSpentCredits,
      lifetimeExpiredCredits: wallet.lifetimeExpiredCredits,
      lifetimeTransferredInCredits: wallet.lifetimeTransferredInCredits,
      lifetimeTransferredOutCredits: wallet.lifetimeTransferredOutCredits,
      lastTransactionAt: lastTransaction?.createdAt.toISOString() ?? null,
      createdAt: wallet.createdAt.toISOString(),
      updatedAt: wallet.updatedAt.toISOString(),
    },
    referral: {
      referralCode: referralProfile.referralCode,
      shareableLink: links.shareableLink,
      deepLink: links.deepLink,
      qualifiedReferralCount: referralProfile.qualifiedReferralCount,
      milestones: {
        milestone5AwardedAt: referralProfile.milestone5AwardedAt?.toISOString() ?? null,
        milestone20AwardedAt: referralProfile.milestone20AwardedAt?.toISOString() ?? null,
        milestone100AwardedAt: referralProfile.milestone100AwardedAt?.toISOString() ?? null,
        ambassadorBadgeAwardedAt: badgeAwardedAt,
      },
      nextMilestone: getNextReferralMilestone(referralProfile.qualifiedReferralCount),
      referralSource: referralSource
        ? {
            relationshipId: referralSource.id,
            referrerUserId: referralSource.referrerUserId,
            referralCodeUsed: referralSource.referralCodeUsed,
            status: referralSource.status,
            fraudReviewStatus: referralSource.fraudReviewStatus,
            fraudReviewReason: referralSource.fraudReviewReason,
            attachedAt: referralSource.attachedAt.toISOString(),
            qualifiedAt: referralSource.qualifiedAt?.toISOString() ?? null,
            rewardedAt: referralSource.rewardedAt?.toISOString() ?? null,
          }
        : null,
    },
    badgeStatus: {
      catcherAmbassador: Boolean(referralProfile.ambassadorBadgeAwardedAt),
      awardedAt: badgeAwardedAt,
    },
  };

  await maybeCreateCreditsExpiringSoonNotification(
    {
      userId,
      walletId: summary.wallet.walletId,
      scheduledExpiringCredits: summary.wallet.scheduledExpiringCredits,
      expiringWindowDays: summary.wallet.expiringWindowDays,
      asOf: now,
    },
    db,
  );

  return summary;
}

export async function listWalletTransactions(
  userId: string,
  params?: {
    limit?: number;
    offset?: number;
    type?: string | null;
  },
  db: WalletReadClient | WalletRootClient = prisma,
) {
  if (hasTransactionCapability(db)) {
    await settleExpiredWalletCredits(userId, db);
  }

  const limit = Math.min(Math.max(params?.limit ?? 20, 1), 100);
  const offset = Math.max(params?.offset ?? 0, 0);
  const type = typeof params?.type === "string" && params.type.trim().length > 0
    ? params.type.trim()
    : null;

  const where: Prisma.WalletTransactionWhereInput = {
    userId,
    ...(type ? { type: type as never } : {}),
  };

  const [count, transactions] = await Promise.all([
    db.walletTransaction.count({ where }),
    db.walletTransaction.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: offset,
      take: limit,
    }),
  ]);

  const data = transactions.map(serializeWalletTransaction);
  return {
    data,
    count,
    next: offset + data.length < count ? String(offset + data.length) : "",
    previous: offset > 0 ? String(Math.max(offset - limit, 0)) : "",
  };
}

export async function transferWalletCredits(
  input: {
    senderUserId: string;
    amountCredits: number;
    recipientEmail?: string | null;
    recipientReferralCode?: string | null;
    note?: string | null;
  },
  db: WalletRootClient = prisma,
) {
  const amountCredits = Math.trunc(input.amountCredits);
  if (!Number.isFinite(amountCredits) || amountCredits <= 0) {
    throw new Error("Transfer amount must be a positive whole number of credits.");
  }

  if (amountCredits < WALLET_TRANSFER_MIN_CREDITS) {
    throw new Error(`Transfers must be at least ${WALLET_TRANSFER_MIN_CREDITS} credit${WALLET_TRANSFER_MIN_CREDITS === 1 ? "" : "s"}.`);
  }

  if (amountCredits > WALLET_TRANSFER_MAX_CREDITS) {
    throw new Error(`Transfers cannot exceed ${WALLET_TRANSFER_MAX_CREDITS} credits in a single transaction.`);
  }

  const normalizedEmail =
    typeof input.recipientEmail === "string" && input.recipientEmail.trim().length > 0
      ? input.recipientEmail.trim().toLowerCase()
      : null;
  const normalizedReferralCode =
    typeof input.recipientReferralCode === "string" && input.recipientReferralCode.trim().length > 0
      ? input.recipientReferralCode.trim().toUpperCase()
      : null;

  if ((!normalizedEmail && !normalizedReferralCode) || (normalizedEmail && normalizedReferralCode)) {
    throw new Error("Provide exactly one recipient identifier: email or referral code.");
  }

  const transfer = await withWalletRetry(db, async (tx) => {
    let recipientUser: { id: string } | null = null;
    if (normalizedEmail) {
      recipientUser = await tx.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });
    } else if (normalizedReferralCode) {
      const recipientProfile = await tx.referralProfile.findUnique({
        where: { referralCode: normalizedReferralCode },
        select: { userId: true },
      });
      recipientUser = recipientProfile ? { id: recipientProfile.userId } : null;
    }

    if (!recipientUser) {
      throw new Error("Recipient not found.");
    }

    if (recipientUser.id === input.senderUserId) {
      throw new Error("You cannot transfer credits to yourself.");
    }

    const transferMoment = new Date();
    const dailyTransferWindow = await getTransferredCreditsForLagosDay(
      tx,
      input.senderUserId,
      transferMoment,
    );

    if (dailyTransferWindow.usedCredits + amountCredits > WALLET_TRANSFER_DAILY_LIMIT_CREDITS) {
      throw new Error(
        `Daily transfer limit exceeded. You can transfer up to ${WALLET_TRANSFER_DAILY_LIMIT_CREDITS} credits per Lagos day.`,
      );
    }

    const recipientWallet = await ensureWallet(tx, recipientUser.id);
    const transferId = randomUUID();
    const note = normalizeWalletTransferNote(input.note);

    const senderDebit = await consumeWalletCreditsInTransaction(tx, {
      userId: input.senderUserId,
      amountCredits,
      type: "giftSent",
      description: note ? `Transfer sent: ${note}` : "Transfer sent",
      referenceType: "wallet_transfer",
      referenceId: transferId,
      note,
      metadata: {
        recipientUserId: recipientUser.id,
      },
      spentCounterField: "lifetimeTransferredOutCredits",
      consumedAt: transferMoment,
    });

    const recipientWalletUpdate = await tx.wallet.update({
      where: { id: recipientWallet.id },
      data: {
        balanceCredits: { increment: amountCredits },
        lifetimeTransferredInCredits: { increment: amountCredits },
      },
    });

    let runningRecipientBalance = recipientWalletUpdate.balanceCredits - amountCredits;
    await tx.walletTransaction.createMany({
      data: senderDebit.consumedLots.map((lot) => {
        runningRecipientBalance += lot.amountCredits;
        return {
          id: randomUUID(),
          walletId: recipientWallet.id,
          userId: recipientUser.id,
          type: "giftReceived",
          direction: "credit",
          amountCredits: lot.amountCredits,
          balanceAfterCredits: runningRecipientBalance,
          description: note ? `Transfer received: ${note}` : "Transfer received",
          referenceType: "wallet_transfer",
          referenceId: transferId,
          createdAt: transferMoment,
          expiresAt: lot.expiresAt ? new Date(lot.expiresAt) : null,
          metadata: {
            senderUserId: input.senderUserId,
            note,
            sourceTransactionId: lot.sourceTransactionId,
            sourceType: lot.sourceType,
          },
        };
      }),
    });

    return {
      transferId,
      amountCredits,
      senderBalanceCredits: senderDebit.wallet.balanceCredits,
      recipientBalanceCredits: recipientWalletUpdate.balanceCredits,
      recipientUserId: recipientUser.id,
      note,
    };
  });

  await Promise.all([
    safeCreateNotification(
      {
        userId: input.senderUserId,
        type: NotificationType.CreditsTransferred,
        title: "Credits sent successfully",
        message: `You sent ${transfer.amountCredits} Catcher Security Credit${transfer.amountCredits === 1 ? "" : "s"} to another user.`,
        payload: {
          transferId: transfer.transferId,
          amountCredits: transfer.amountCredits,
          recipientUserId: transfer.recipientUserId,
          note: transfer.note,
          targetMobileRoute: "/wallet/transactions",
        },
      },
      db,
    ),
    safeCreateNotification(
      {
        userId: transfer.recipientUserId,
        type: NotificationType.CreditsReceived,
        title: "Credits received",
        message: `You received ${transfer.amountCredits} Catcher Security Credit${transfer.amountCredits === 1 ? "" : "s"} from another Catcher user.`,
        payload: {
          transferId: transfer.transferId,
          amountCredits: transfer.amountCredits,
          senderUserId: input.senderUserId,
          note: transfer.note,
          targetMobileRoute: "/wallet/transactions",
        },
      },
      db,
    ),
  ]);

  return transfer;
}

export async function creditWalletCredits(
  input: {
    userId: string;
    type: "referralBonus" | "milestoneBonus" | "promotionBonus" | "giftReceived" | "manualGrant" | "registrationRefund" | "adminAdjustment";
    amountCredits: number;
    description: string;
    referenceType: string;
    referenceId: string;
    metadata?: Record<string, Prisma.JsonValue>;
    earnedAt?: Date;
    expiresAt?: Date | null;
    incrementEarnedCredits?: boolean;
    incrementTransferredInCredits?: boolean;
  },
  db: WalletRootClient = prisma,
) {
  const amountCredits = Math.trunc(input.amountCredits);
  if (!Number.isFinite(amountCredits) || amountCredits <= 0) {
    throw new Error("Credit amount must be a positive whole number of credits.");
  }

  return withWalletRetry(db, async (tx) => {
    const wallet = await ensureWallet(tx, input.userId);
    const earnedAt = input.earnedAt ?? new Date();
    const expiresAt = input.expiresAt === undefined ? buildCreditExpiryDate(earnedAt) : input.expiresAt;
    const walletData: Prisma.WalletUpdateInput = {
      balanceCredits: { increment: amountCredits },
    };

    if (input.incrementEarnedCredits) {
      walletData.lifetimeEarnedCredits = { increment: amountCredits };
    }

    if (input.incrementTransferredInCredits) {
      walletData.lifetimeTransferredInCredits = { increment: amountCredits };
    }

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: walletData,
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        id: randomUUID(),
        walletId: wallet.id,
        userId: input.userId,
        type: input.type,
        direction: "credit",
        amountCredits,
        balanceAfterCredits: updatedWallet.balanceCredits,
        description: input.description,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        expiresAt,
        metadata: input.metadata ?? undefined,
        createdAt: earnedAt,
      },
    });

    return {
      wallet: updatedWallet,
      transaction,
    };
  });
}
export async function adjustWalletCreditsByAdmin(
  input: {
    userId: string;
    amountCredits: number;
    reason: string;
    referenceId: string;
    metadata?: Record<string, Prisma.JsonValue>;
    adjustedAt?: Date;
  },
  db: WalletRootClient = prisma,
) {
  const amountCredits = Math.trunc(input.amountCredits);
  if (!Number.isFinite(amountCredits) || amountCredits === 0) {
    throw new Error("Adjustment amount must be a non-zero whole number of credits.");
  }

  const reason = input.reason.trim();
  if (!reason) {
    throw new Error("Adjustment reason is required.");
  }

  const description = reason.slice(0, 255);

  if (amountCredits > 0) {
    return creditWalletCredits(
      {
        userId: input.userId,
        type: "adminAdjustment",
        amountCredits,
        description,
        referenceType: "admin_wallet_adjustment",
        referenceId: input.referenceId,
        metadata: input.metadata,
        earnedAt: input.adjustedAt,
        expiresAt: null,
      },
      db,
    );
  }

  return spendWalletCredits(
    {
      userId: input.userId,
      amountCredits: Math.abs(amountCredits),
      type: "adminAdjustment",
      description,
      referenceType: "admin_wallet_adjustment",
      referenceId: input.referenceId,
      metadata: input.metadata,
      consumedAt: input.adjustedAt,
    },
    db,
  );
}

