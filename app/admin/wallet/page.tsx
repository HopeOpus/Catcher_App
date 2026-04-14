import { requireAdminPageAccess } from '@/lib/admin-access'
import { prisma } from '@/lib/prisma'
import {
  AdminPageHeader,
  AdminPageNotice,
  getAdminPageNotice,
  type AdminPageSearchParams,
} from '../admin-page-utils'
import {
  AdminWalletSupportPanel,
  type AdminPromotionCampaignRow,
  type AdminReferralReviewRow,
  type AdminSuspiciousClusterRow,
  type AdminWalletAnalyticsSnapshot,
  type AdminWalletLedgerRow,
  type AdminWalletUsageRow,
} from './admin-wallet-support-panel'

const WALLET_USAGE_LABELS: Record<string, string> = {
  registrationSpend: 'Item registration',
  premiumFeatureSpend: 'Premium features',
  theftAlertBoostSpend: 'Theft alert boosts',
  giftSent: 'Family transfers sent',
  giftReceived: 'Family transfers received',
  expiryDebit: 'Expired credits',
  referralBonus: 'Referral rewards',
  milestoneBonus: 'Milestone rewards',
  promotionBonus: 'Promotion rewards',
  adminAdjustment: 'Admin adjustments',
}

function toIso(value: Date | null | undefined) {
  return value?.toISOString() ?? null
}

function toPercent(value: number) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : 0
}

export default async function AdminWalletPage({
  searchParams,
}: {
  searchParams?: AdminPageSearchParams
}) {
  await requireAdminPageAccess()
  const notice = await getAdminPageNotice(searchParams)

  const [
    walletCount,
    walletTotals,
    transferEntryCount,
    suspiciousReferralCount,
    disabledReferralCount,
    activePromotionCount,
    ledger,
    referrals,
    promotions,
    referralProfileCount,
    qualifiedReferralCount,
    rewardedReferralCount,
    transferAggregate,
    expiredAggregate,
    usageBreakdown,
    clusterSource,
  ] = await Promise.all([
    prisma.wallet.count(),
    prisma.wallet.aggregate({ _sum: { balanceCredits: true } }),
    prisma.walletTransaction.count({ where: { type: { in: ['giftSent', 'giftReceived'] } } }),
    prisma.referralRelationship.count({ where: { fraudReviewStatus: { in: ['flagged', 'blocked'] } } }),
    prisma.referralProfile.count({ where: { isDisabled: true } }),
    prisma.promotionCampaign.count({ where: { status: 'active' } }),
    prisma.walletTransaction.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        promotionCampaign: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 200,
    }),
    prisma.referralRelationship.findMany({
      include: {
        referrer: { select: { id: true, name: true, email: true } },
        referred: { select: { id: true, name: true, email: true } },
        referralProfile: {
          select: {
            id: true,
            referralCode: true,
            isDisabled: true,
            disabledAt: true,
            disabledReason: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: 150,
    }),
    prisma.promotionCampaign.findMany({
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: 40,
    }),
    prisma.referralProfile.count(),
    prisma.referralRelationship.count({ where: { qualifiedAt: { not: null } } }),
    prisma.referralRelationship.count({ where: { rewardedAt: { not: null } } }),
    prisma.walletTransaction.aggregate({
      where: { type: 'giftSent' },
      _sum: { amountCredits: true },
      _count: { id: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { type: 'expiryDebit' },
      _sum: { amountCredits: true },
      _count: { id: true },
    }),
    prisma.walletTransaction.groupBy({
      by: ['type'],
      where: {
        type: {
          in: [
            'registrationSpend',
            'premiumFeatureSpend',
            'theftAlertBoostSpend',
            'giftSent',
            'giftReceived',
            'expiryDebit',
            'referralBonus',
            'milestoneBonus',
            'promotionBonus',
            'adminAdjustment',
          ],
        },
      },
      _sum: { amountCredits: true },
      _count: { _all: true },
    }),
    prisma.referralRelationship.findMany({
      select: {
        id: true,
        attachDeviceInstallId: true,
        fraudReviewStatus: true,
        attachedAt: true,
        referrer: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ attachedAt: 'desc' }],
    }),
  ])

  const attachedReferralCount = referrals.length > 0 ? Math.max(referrals.length, await prisma.referralRelationship.count()) : await prisma.referralRelationship.count()

  const ledgerRows: AdminWalletLedgerRow[] = ledger.map((entry) => ({
    id: entry.id,
    userId: entry.userId,
    userName: entry.user.name,
    userEmail: entry.user.email,
    type: entry.type,
    direction: entry.direction,
    amountCredits: entry.amountCredits,
    balanceAfterCredits: entry.balanceAfterCredits,
    description: entry.description,
    referenceType: entry.referenceType,
    referenceId: entry.referenceId,
    expiresAt: toIso(entry.expiresAt),
    createdAt: entry.createdAt.toISOString(),
    promotionCampaignName: entry.promotionCampaign?.name ?? null,
    promotionCampaignCode: entry.promotionCampaign?.code ?? null,
  }))

  const referralRows: AdminReferralReviewRow[] = referrals.map((entry) => ({
    id: entry.id,
    referralProfileId: entry.referralProfileId,
    profileReferralCode: entry.referralProfile.referralCode,
    referrerName: entry.referrer.name,
    referrerEmail: entry.referrer.email,
    referredName: entry.referred.name,
    referredEmail: entry.referred.email,
    referralCodeUsed: entry.referralCodeUsed,
    status: entry.status,
    fraudReviewStatus: entry.fraudReviewStatus,
    fraudReviewReason: entry.fraudReviewReason,
    attachedAt: entry.attachedAt.toISOString(),
    qualifiedAt: toIso(entry.qualifiedAt),
    rewardedAt: toIso(entry.rewardedAt),
    isDisabled: entry.referralProfile.isDisabled,
    disabledAt: toIso(entry.referralProfile.disabledAt),
    disabledReason: entry.referralProfile.disabledReason,
  }))

  const promotionRows: AdminPromotionCampaignRow[] = promotions.map((campaign) => {
    const metadata = campaign.metadata && typeof campaign.metadata === 'object' && !Array.isArray(campaign.metadata)
      ? (campaign.metadata as Record<string, unknown>)
      : null

    return {
      id: campaign.id,
      name: campaign.name,
      code: campaign.code,
      status: campaign.status,
      rewardCredits: campaign.rewardCredits,
      startsAt: toIso(campaign.startsAt),
      endsAt: toIso(campaign.endsAt),
      maxRedemptions: campaign.maxRedemptions,
      updatedAt: campaign.updatedAt.toISOString(),
      adminNote: typeof metadata?.adminNote === 'string' ? metadata.adminNote : null,
    }
  })

  const usageRows: AdminWalletUsageRow[] = usageBreakdown
    .map((entry) => ({
      id: entry.type,
      type: entry.type,
      label: WALLET_USAGE_LABELS[entry.type] ?? entry.type,
      transactionCount: entry._count._all,
      totalCredits: entry._sum.amountCredits ?? 0,
    }))
    .sort((a, b) => b.totalCredits - a.totalCredits || b.transactionCount - a.transactionCount)

  const installGroups = new Map<string, AdminSuspiciousClusterRow>()
  const referrerGroups = new Map<string, AdminSuspiciousClusterRow>()

  for (const relationship of clusterSource) {
    if (relationship.attachDeviceInstallId) {
      const existing = installGroups.get(relationship.attachDeviceInstallId) ?? {
        id: `install:${relationship.attachDeviceInstallId}`,
        kind: 'install',
        label: relationship.attachDeviceInstallId,
        relationshipCount: 0,
        flaggedCount: 0,
        blockedCount: 0,
        lastAttachedAt: relationship.attachedAt.toISOString(),
      }
      existing.relationshipCount += 1
      existing.flaggedCount += relationship.fraudReviewStatus === 'flagged' ? 1 : 0
      existing.blockedCount += relationship.fraudReviewStatus === 'blocked' ? 1 : 0
      if (relationship.attachedAt.toISOString() > existing.lastAttachedAt) {
        existing.lastAttachedAt = relationship.attachedAt.toISOString()
      }
      installGroups.set(relationship.attachDeviceInstallId, existing)
    }

    const referrerKey = relationship.referrer.id
    const existingReferrer = referrerGroups.get(referrerKey) ?? {
      id: `referrer:${referrerKey}`,
      kind: 'referrer',
      label: relationship.referrer.name.trim() || relationship.referrer.email,
      secondaryLabel: relationship.referrer.email,
      relationshipCount: 0,
      flaggedCount: 0,
      blockedCount: 0,
      lastAttachedAt: relationship.attachedAt.toISOString(),
    }
    existingReferrer.relationshipCount += 1
    existingReferrer.flaggedCount += relationship.fraudReviewStatus === 'flagged' ? 1 : 0
    existingReferrer.blockedCount += relationship.fraudReviewStatus === 'blocked' ? 1 : 0
    if (relationship.attachedAt.toISOString() > existingReferrer.lastAttachedAt) {
      existingReferrer.lastAttachedAt = relationship.attachedAt.toISOString()
    }
    referrerGroups.set(referrerKey, existingReferrer)
  }

  const suspiciousClusters = [
    ...Array.from(installGroups.values()).filter((item) => item.relationshipCount > 1 || item.flaggedCount > 0 || item.blockedCount > 0),
    ...Array.from(referrerGroups.values()).filter((item) => item.flaggedCount > 0 || item.blockedCount > 0 || item.relationshipCount >= 5),
  ]
    .sort((a, b) => b.blockedCount - a.blockedCount || b.flaggedCount - a.flaggedCount || b.relationshipCount - a.relationshipCount || b.lastAttachedAt.localeCompare(a.lastAttachedAt))
    .slice(0, 12)

  const analytics: AdminWalletAnalyticsSnapshot = {
    referralProfileCount,
    attachedReferralCount,
    qualifiedReferralCount,
    rewardedReferralCount,
    qualificationRatePct: attachedReferralCount > 0 ? toPercent((qualifiedReferralCount / attachedReferralCount) * 100) : 0,
    rewardCompletionRatePct: qualifiedReferralCount > 0 ? toPercent((rewardedReferralCount / qualifiedReferralCount) * 100) : 0,
    transferVolumeCredits: transferAggregate._sum.amountCredits ?? 0,
    transferCount: transferAggregate._count.id,
    expiredCreditsTotal: expiredAggregate._sum.amountCredits ?? 0,
    expiryEventCount: expiredAggregate._count.id,
    usageRows,
    suspiciousClusters,
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Wallet & Referrals"
        description="Support the Catcher Security Credit system with admin controls, launch analytics, fraud-monitoring signals, and rollout guidance in one place."
      />
      <AdminPageNotice notice={notice} />
      <AdminWalletSupportPanel
        summary={{
          walletCount,
          liveCredits: walletTotals._sum.balanceCredits ?? 0,
          transferEntryCount,
          suspiciousReferralCount,
          disabledReferralCount,
          activePromotionCount,
        }}
        analytics={analytics}
        ledgerRows={ledgerRows}
        referralRows={referralRows}
        promotionCampaigns={promotionRows}
      />
    </div>
  )
}

