'use client'

import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  adjustWalletCreditsAction,
  createPromotionCampaignAction,
  toggleReferralCodeStatusAction,
  updatePromotionCampaignStatusAction,
  updateReferralReviewStatusAction,
} from '../actions'
import { formatAdminDateTime } from '../admin-page-utils'

export type AdminWalletLedgerRow = {
  id: string
  userId: string
  userName: string
  userEmail: string
  type: string
  direction: string
  amountCredits: number
  balanceAfterCredits: number
  description: string | null
  referenceType: string | null
  referenceId: string | null
  expiresAt: string | null
  createdAt: string
  promotionCampaignName: string | null
  promotionCampaignCode: string | null
}

export type AdminReferralReviewRow = {
  id: string
  referralProfileId: string
  profileReferralCode: string
  referrerName: string
  referrerEmail: string
  referredName: string
  referredEmail: string
  referralCodeUsed: string
  status: string
  fraudReviewStatus: string
  fraudReviewReason: string | null
  attachedAt: string
  qualifiedAt: string | null
  rewardedAt: string | null
  isDisabled: boolean
  disabledAt: string | null
  disabledReason: string | null
}

export type AdminPromotionCampaignRow = {
  id: string
  name: string
  code: string | null
  status: string
  rewardCredits: number
  startsAt: string | null
  endsAt: string | null
  maxRedemptions: number | null
  updatedAt: string
  adminNote: string | null
}

export type AdminWalletUsageRow = {
  id: string
  type: string
  label: string
  transactionCount: number
  totalCredits: number
}

export type AdminSuspiciousClusterRow = {
  id: string
  kind: 'install' | 'referrer'
  label: string
  secondaryLabel?: string
  relationshipCount: number
  flaggedCount: number
  blockedCount: number
  lastAttachedAt: string
}

export type AdminWalletAnalyticsSnapshot = {
  referralProfileCount: number
  attachedReferralCount: number
  qualifiedReferralCount: number
  rewardedReferralCount: number
  qualificationRatePct: number
  rewardCompletionRatePct: number
  transferVolumeCredits: number
  transferCount: number
  expiredCreditsTotal: number
  expiryEventCount: number
  usageRows: AdminWalletUsageRow[]
  suspiciousClusters: AdminSuspiciousClusterRow[]
}

type Summary = {
  walletCount: number
  liveCredits: number
  transferEntryCount: number
  suspiciousReferralCount: number
  disabledReferralCount: number
  activePromotionCount: number
}

type LedgerFilter = 'all' | 'transfers' | 'adjustments' | 'referrals' | 'promotions' | 'spends' | 'expiries'
type ReferralFilter = 'all' | 'flagged' | 'blocked' | 'disabled'

function formatCredits(value: number) {
  return new Intl.NumberFormat('en-NG').format(value)
}

function chipClass(active: boolean) {
  return active
    ? 'bg-[#36689e] text-white hover:bg-[#0F2651]'
    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
}

function badgeTone(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes('blocked') || normalized.includes('expired') || normalized.includes('debit')) return 'bg-red-100 text-red-800'
  if (normalized.includes('flagged') || normalized.includes('pending') || normalized.includes('draft')) return 'bg-amber-100 text-amber-800'
  if (normalized.includes('active') || normalized.includes('qualified') || normalized.includes('rewarded') || normalized.includes('credit')) return 'bg-green-100 text-green-800'
  return 'bg-slate-100 text-slate-700'
}

function matchesLedgerFilter(row: AdminWalletLedgerRow, filter: LedgerFilter) {
  switch (filter) {
    case 'transfers': return row.type === 'giftSent' || row.type === 'giftReceived'
    case 'adjustments': return row.type === 'adminAdjustment'
    case 'referrals': return row.type === 'referralBonus' || row.type === 'milestoneBonus'
    case 'promotions': return row.type === 'promotionBonus'
    case 'spends': return row.type === 'registrationSpend' || row.type === 'premiumFeatureSpend' || row.type === 'theftAlertBoostSpend'
    case 'expiries': return row.type === 'expiryDebit'
    default: return true
  }
}

function matchesReferralFilter(row: AdminReferralReviewRow, filter: ReferralFilter) {
  switch (filter) {
    case 'flagged': return row.fraudReviewStatus === 'flagged'
    case 'blocked': return row.fraudReviewStatus === 'blocked'
    case 'disabled': return row.isDisabled
    default: return true
  }
}

const rolloutStages = [
  '1. Internal testing',
  '2. Small beta rollout',
  '3. Referral rewards only',
  '4. Transfers',
  '5. Credit checkout',
  '6. Promotions',
]

export function AdminWalletSupportPanel({
  summary,
  analytics,
  ledgerRows,
  referralRows,
  promotionCampaigns,
}: {
  summary: Summary
  analytics: AdminWalletAnalyticsSnapshot
  ledgerRows: AdminWalletLedgerRow[]
  referralRows: AdminReferralReviewRow[]
  promotionCampaigns: AdminPromotionCampaignRow[]
}) {
  const [ledgerFilter, setLedgerFilter] = React.useState<LedgerFilter>('all')
  const [referralFilter, setReferralFilter] = React.useState<ReferralFilter>('all')
  const [selectedLedgerId, setSelectedLedgerId] = React.useState<string | null>(ledgerRows[0]?.id ?? null)
  const [selectedReferralId, setSelectedReferralId] = React.useState<string | null>(referralRows[0]?.id ?? null)

  const filteredLedgerRows = React.useMemo(() => ledgerRows.filter((row) => matchesLedgerFilter(row, ledgerFilter)), [ledgerFilter, ledgerRows])
  const filteredReferralRows = React.useMemo(() => referralRows.filter((row) => matchesReferralFilter(row, referralFilter)), [referralFilter, referralRows])

  React.useEffect(() => {
    if (!filteredLedgerRows.some((row) => row.id === selectedLedgerId)) {
      setSelectedLedgerId(filteredLedgerRows[0]?.id ?? null)
    }
  }, [filteredLedgerRows, selectedLedgerId])

  React.useEffect(() => {
    if (!filteredReferralRows.some((row) => row.id === selectedReferralId)) {
      setSelectedReferralId(filteredReferralRows[0]?.id ?? null)
    }
  }, [filteredReferralRows, selectedReferralId])

  const selectedLedger = filteredLedgerRows.find((row) => row.id === selectedLedgerId) ?? null
  const selectedReferral = filteredReferralRows.find((row) => row.id === selectedReferralId) ?? null

  const ledgerColumns = React.useMemo<ColumnDef<AdminWalletLedgerRow>[]>(() => [
    {
      accessorKey: 'userEmail',
      header: 'User',
      cell: ({ row }) => <div><p className="font-medium text-[#0F2651]">{row.original.userName || 'Unknown user'}</p><p className="text-xs text-slate-500">{row.original.userEmail}</p></div>,
    },
    {
      accessorKey: 'type',
      header: 'Entry',
      cell: ({ row }) => <div className="space-y-2"><Badge className={badgeTone(row.original.direction)}>{row.original.direction}</Badge><p className="text-sm text-slate-700">{row.original.type}</p></div>,
    },
    {
      accessorKey: 'amountCredits',
      header: 'Credits',
      cell: ({ row }) => <div><p className="font-semibold text-[#0F2651]">{row.original.direction === 'debit' ? '-' : '+'}{formatCredits(row.original.amountCredits)}</p><p className="text-xs text-slate-500">Balance {formatCredits(row.original.balanceAfterCredits)}</p></div>,
    },
    {
      accessorKey: 'referenceId',
      header: 'Reference',
      cell: ({ row }) => <div><p className="break-all text-sm text-slate-700">{row.original.referenceId ?? 'Not available'}</p><p className="text-xs text-slate-500">{row.original.referenceType ?? 'No reference type'}</p></div>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => <span className="text-sm text-slate-600">{formatAdminDateTime(row.original.createdAt)}</span>,
    },
  ], [])

  const referralColumns = React.useMemo<ColumnDef<AdminReferralReviewRow>[]>(() => [
    {
      accessorKey: 'profileReferralCode',
      header: 'Code',
      cell: ({ row }) => <div><p className="font-semibold text-[#0F2651]">{row.original.profileReferralCode}</p><p className="text-xs text-slate-500">Used as {row.original.referralCodeUsed}</p></div>,
    },
    {
      accessorKey: 'referrerEmail',
      header: 'Referrer',
      cell: ({ row }) => <div><p className="font-medium text-[#0F2651]">{row.original.referrerName || 'Unknown referrer'}</p><p className="text-xs text-slate-500">{row.original.referrerEmail}</p></div>,
    },
    {
      accessorKey: 'referredEmail',
      header: 'Referred User',
      cell: ({ row }) => <div><p className="font-medium text-[#0F2651]">{row.original.referredName || 'Unknown user'}</p><p className="text-xs text-slate-500">{row.original.referredEmail}</p></div>,
    },
    {
      accessorKey: 'fraudReviewStatus',
      header: 'Review',
      cell: ({ row }) => <div className="space-y-2"><Badge className={badgeTone(row.original.fraudReviewStatus)}>{row.original.fraudReviewStatus}</Badge><Badge className={badgeTone(row.original.status)}>{row.original.status}</Badge></div>,
    },
    {
      accessorKey: 'attachedAt',
      header: 'Attached',
      cell: ({ row }) => <span className="text-sm text-slate-600">{formatAdminDateTime(row.original.attachedAt)}</span>,
    },
  ], [])

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Wallets', value: formatCredits(summary.walletCount), detail: 'Active Catcher Wallet records' },
          { label: 'Live Credits', value: formatCredits(summary.liveCredits), detail: 'Current total spendable snapshot' },
          { label: 'Transfer Entries', value: formatCredits(summary.transferEntryCount), detail: 'Gift sent and received ledger events' },
          { label: 'Suspicious Referrals', value: formatCredits(summary.suspiciousReferralCount), detail: 'Flagged or blocked relationships' },
          { label: 'Disabled Codes', value: formatCredits(summary.disabledReferralCount), detail: 'Referral codes currently disabled' },
          { label: 'Active Promotions', value: formatCredits(summary.activePromotionCount), detail: 'Campaigns currently marked active' },
        ].map((item) => (
          <Card key={item.label} className="border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl text-[#0F2651]">{item.value}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-sm text-slate-600">{item.detail}</p></CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr_0.95fr]">
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-[#0F2651]">Referral conversion funnel</CardTitle>
            <CardDescription>Track how referrals move from link ownership to qualification and reward payout before launch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Profiles with codes</p><p className="mt-2 text-2xl font-semibold text-[#0F2651]">{formatCredits(analytics.referralProfileCount)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Attached referrals</p><p className="mt-2 text-2xl font-semibold text-[#0F2651]">{formatCredits(analytics.attachedReferralCount)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Qualified referrals</p><p className="mt-2 text-2xl font-semibold text-[#0F2651]">{formatCredits(analytics.qualifiedReferralCount)}</p><p className="mt-1 text-xs text-slate-500">Qualification rate {analytics.qualificationRatePct}%</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Rewarded referrals</p><p className="mt-2 text-2xl font-semibold text-[#0F2651]">{formatCredits(analytics.rewardedReferralCount)}</p><p className="mt-1 text-xs text-slate-500">Reward completion {analytics.rewardCompletionRatePct}%</p></div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
              A healthy funnel should show attachment growing first, then qualification after real checkouts, then rewards following without a backlog. Watch for a large gap between qualified and rewarded.
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-[#0F2651]">Wallet usage by feature</CardTitle>
            <CardDescription>See where Catcher Security Credit is actually being earned, spent, transferred, and lost to expiry.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Transfer volume</p><p className="mt-2 text-2xl font-semibold text-[#0F2651]">{formatCredits(analytics.transferVolumeCredits)}</p><p className="mt-1 text-xs text-slate-500">Across {formatCredits(analytics.transferCount)} outgoing transfers</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Expired credits</p><p className="mt-2 text-2xl font-semibold text-[#0F2651]">{formatCredits(analytics.expiredCreditsTotal)}</p><p className="mt-1 text-xs text-slate-500">Across {formatCredits(analytics.expiryEventCount)} expiry events</p></div>
            </div>
            <div className="space-y-3">
              {analytics.usageRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">No wallet activity has been recorded yet.</div>
              ) : analytics.usageRows.slice(0, 8).map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3">
                  <div><p className="font-medium text-[#0F2651]">{row.label}</p><p className="text-xs text-slate-500">{formatCredits(row.transactionCount)} transactions</p></div>
                  <Badge className={row.totalCredits > 0 ? 'bg-[#36689e]/10 text-[#0F2651]' : 'bg-slate-100 text-slate-700'}>{formatCredits(row.totalCredits)} credits</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Suspicious clusters</CardTitle>
              <CardDescription>Watch for repeated install IDs and referrers accumulating flagged or blocked relationships.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.suspiciousClusters.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">No suspicious clusters detected yet.</div>
              ) : analytics.suspiciousClusters.map((cluster) => (
                <div key={cluster.id} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[#0F2651]">{cluster.kind === 'install' ? 'Install cluster' : 'Referrer cluster'}</p>
                      <p className="text-sm text-slate-600">{cluster.label}</p>
                      {cluster.secondaryLabel ? <p className="text-xs text-slate-500">{cluster.secondaryLabel}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-slate-100 text-slate-700">{formatCredits(cluster.relationshipCount)} relationships</Badge>
                      {cluster.flaggedCount > 0 ? <Badge className="bg-amber-100 text-amber-800">{formatCredits(cluster.flaggedCount)} flagged</Badge> : null}
                      {cluster.blockedCount > 0 ? <Badge className="bg-red-100 text-red-800">{formatCredits(cluster.blockedCount)} blocked</Badge> : null}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Last attached {formatAdminDateTime(cluster.lastAttachedAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-[#0F2651]">Recommended rollout</CardTitle>
              <CardDescription>Use this sequence to reduce risk while the wallet and referral system proves itself in production.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-slate-600">
                {rolloutStages.map((stage) => <li key={stage} className="rounded-2xl bg-slate-50 px-4 py-3">{stage}</li>)}
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Card className="border-slate-200 bg-white"><CardHeader><CardTitle className="text-[#0F2651]">Wallet ledger & transfer history</CardTitle><CardDescription>Review wallet movement, transfers, promotions, spends, and expiries in one searchable ledger.</CardDescription></CardHeader><CardContent>
          <AdminDataTable
            columns={ledgerColumns}
            data={filteredLedgerRows}
            entityLabel="ledger entries"
            emptyStateTitle="No wallet entries match this filter"
            emptyStateDescription="Try a broader filter or wait for wallet activity to come in."
            selectedRowId={selectedLedgerId}
            onSelectRow={setSelectedLedgerId}
            baseCount={ledgerRows.length}
            renderMobileCard={(item) => <div className="space-y-2"><div className="flex flex-wrap gap-2"><Badge className={badgeTone(item.direction)}>{item.direction}</Badge><Badge className="bg-slate-100 text-slate-700">{item.type}</Badge></div><p className="font-medium text-[#0F2651]">{item.userName || item.userEmail}</p><p className="text-sm text-slate-600">{item.userEmail}</p><p className="text-sm text-slate-600">{item.direction === 'debit' ? '-' : '+'}{formatCredits(item.amountCredits)} credits</p><p className="text-xs text-slate-500">{formatAdminDateTime(item.createdAt)}</p></div>}
            searchPlaceholder="Search wallet entries"
            searchPredicate={(item, query) => [item.userName, item.userEmail, item.type, item.referenceId, item.referenceType, item.description].filter(Boolean).join(' ').toLowerCase().includes(query)}
            toolbar={<div className="flex flex-wrap gap-2">{(['all','transfers','adjustments','referrals','promotions','spends','expiries'] as LedgerFilter[]).map((filter) => <Button key={filter} type="button" size="sm" className={chipClass(ledgerFilter === filter)} onClick={() => setLedgerFilter(filter)}>{filter === 'all' ? 'All entries' : filter}</Button>)}</div>}
          />
        </CardContent></Card>

        <div className="space-y-6">
          <Card className="border-slate-200 bg-white"><CardHeader><CardTitle className="text-[#0F2651]">Selected ledger detail</CardTitle><CardDescription>Quick context for support-led wallet investigations and transfer tracing.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm text-slate-600">{selectedLedger ? <><p><span className="font-semibold text-[#0F2651]">User:</span> {selectedLedger.userName || 'Unknown user'} ({selectedLedger.userEmail})</p><p><span className="font-semibold text-[#0F2651]">Entry:</span> {selectedLedger.type} / {selectedLedger.direction}</p><p><span className="font-semibold text-[#0F2651]">Credits:</span> {selectedLedger.direction === 'debit' ? '-' : '+'}{formatCredits(selectedLedger.amountCredits)} with running balance {formatCredits(selectedLedger.balanceAfterCredits)}</p><p><span className="font-semibold text-[#0F2651]">Reference:</span> {selectedLedger.referenceType ?? 'Not available'} {selectedLedger.referenceId ? `(${selectedLedger.referenceId})` : ''}</p><p><span className="font-semibold text-[#0F2651]">Description:</span> {selectedLedger.description ?? 'No description provided.'}</p><p><span className="font-semibold text-[#0F2651]">Created:</span> {formatAdminDateTime(selectedLedger.createdAt)}</p><p><span className="font-semibold text-[#0F2651]">Expires:</span> {selectedLedger.expiresAt ? formatAdminDateTime(selectedLedger.expiresAt) : 'Does not expire'}</p>{selectedLedger.promotionCampaignName ? <p><span className="font-semibold text-[#0F2651]">Campaign:</span> {selectedLedger.promotionCampaignName}{selectedLedger.promotionCampaignCode ? ` (${selectedLedger.promotionCampaignCode})` : ''}</p> : null}</> : <p>Select a ledger entry to inspect it here.</p>}</CardContent></Card>

          <Card className="border-slate-200 bg-white"><CardHeader><CardTitle className="text-[#0F2651]">Adjust user wallet</CardTitle><CardDescription>Grant or debit Catcher Security Credit with an auditable admin reason.</CardDescription></CardHeader><CardContent>
            <form action={adjustWalletCreditsAction} className="space-y-4">
              <input type="hidden" name="redirect_to" value="/admin/wallet" />
              <div className="space-y-2"><label className="text-sm font-medium text-slate-700">User email</label><Input name="user_email" type="email" placeholder="user@example.com" required /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Signed credit amount</label><Input name="amount_credits" type="number" placeholder="Use positive to credit, negative to debit" required /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Reason</label><Textarea name="reason" placeholder="Explain why this adjustment is needed" required /></div>
              <Button type="submit" className="bg-[#36689e] text-white hover:bg-[#0F2651]">Save wallet adjustment</Button>
            </form>
          </CardContent></Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="border-slate-200 bg-white"><CardHeader><CardTitle className="text-[#0F2651]">Referral review & code controls</CardTitle><CardDescription>Review suspicious referrals, lock abusive codes, and keep referral attribution clean.</CardDescription></CardHeader><CardContent>
          <AdminDataTable
            columns={referralColumns}
            data={filteredReferralRows}
            entityLabel="referral relationships"
            emptyStateTitle="No referral relationships match this filter"
            emptyStateDescription="Blocked, flagged, and disabled referral cases will show up here for review."
            selectedRowId={selectedReferralId}
            onSelectRow={setSelectedReferralId}
            baseCount={referralRows.length}
            renderMobileCard={(item) => <div className="space-y-2"><div className="flex flex-wrap gap-2"><Badge className={badgeTone(item.fraudReviewStatus)}>{item.fraudReviewStatus}</Badge><Badge className={badgeTone(item.status)}>{item.status}</Badge>{item.isDisabled ? <Badge className="bg-red-100 text-red-800">code disabled</Badge> : null}</div><p className="font-medium text-[#0F2651]">{item.profileReferralCode}</p><p className="text-sm text-slate-600">{item.referrerEmail} → {item.referredEmail}</p><p className="text-xs text-slate-500">Attached {formatAdminDateTime(item.attachedAt)}</p></div>}
            searchPlaceholder="Search referral relationships"
            searchPredicate={(item, query) => [item.profileReferralCode, item.referralCodeUsed, item.referrerName, item.referrerEmail, item.referredName, item.referredEmail, item.fraudReviewReason, item.disabledReason].filter(Boolean).join(' ').toLowerCase().includes(query)}
            toolbar={<div className="flex flex-wrap gap-2">{(['all','flagged','blocked','disabled'] as ReferralFilter[]).map((filter) => <Button key={filter} type="button" size="sm" className={chipClass(referralFilter === filter)} onClick={() => setReferralFilter(filter)}>{filter === 'all' ? 'All relationships' : filter}</Button>)}</div>}
          />
        </CardContent></Card>

        <div className="space-y-6">
          <Card className="border-slate-200 bg-white"><CardHeader><CardTitle className="text-[#0F2651]">Selected referral detail</CardTitle><CardDescription>Use this panel to resolve suspicious referrals and disable abusive codes.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm text-slate-600">{selectedReferral ? <><p><span className="font-semibold text-[#0F2651]">Code:</span> {selectedReferral.profileReferralCode}</p><p><span className="font-semibold text-[#0F2651]">Referrer:</span> {selectedReferral.referrerName || 'Unknown'} ({selectedReferral.referrerEmail})</p><p><span className="font-semibold text-[#0F2651]">Referred user:</span> {selectedReferral.referredName || 'Unknown'} ({selectedReferral.referredEmail})</p><p><span className="font-semibold text-[#0F2651]">Status:</span> {selectedReferral.status} / {selectedReferral.fraudReviewStatus}</p><p><span className="font-semibold text-[#0F2651]">Attached:</span> {formatAdminDateTime(selectedReferral.attachedAt)}</p><p><span className="font-semibold text-[#0F2651]">Qualified:</span> {selectedReferral.qualifiedAt ? formatAdminDateTime(selectedReferral.qualifiedAt) : 'Not yet qualified'}</p><p><span className="font-semibold text-[#0F2651]">Rewarded:</span> {selectedReferral.rewardedAt ? formatAdminDateTime(selectedReferral.rewardedAt) : 'Not yet rewarded'}</p><p><span className="font-semibold text-[#0F2651]">Review reason:</span> {selectedReferral.fraudReviewReason ?? 'No review note yet.'}</p><p><span className="font-semibold text-[#0F2651]">Code status:</span> {selectedReferral.isDisabled ? `Disabled${selectedReferral.disabledReason ? ` (${selectedReferral.disabledReason})` : ''}` : 'Active'}</p></> : <p>Select a referral relationship to review it here.</p>}</CardContent></Card>

          <Card className="border-slate-200 bg-white"><CardHeader><CardTitle className="text-[#0F2651]">Review suspicious referral</CardTitle></CardHeader><CardContent>
            <form action={updateReferralReviewStatusAction} className="space-y-4">
              <input type="hidden" name="redirect_to" value="/admin/wallet" />
              <input type="hidden" name="relationship_id" value={selectedReferral?.id ?? ''} />
              <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Review status</label><select name="fraud_review_status" defaultValue={selectedReferral?.fraudReviewStatus ?? 'clear'} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"><option value="clear">clear</option><option value="flagged">flagged</option><option value="blocked">blocked</option></select></div>
              <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Review reason</label><Textarea name="review_reason" defaultValue={selectedReferral?.fraudReviewReason ?? ''} placeholder="Explain the fraud review decision" /></div>
              <Button type="submit" disabled={!selectedReferral} className="bg-[#36689e] text-white hover:bg-[#0F2651]">Save referral review</Button>
            </form>
          </CardContent></Card>

          <Card className="border-slate-200 bg-white"><CardHeader><CardTitle className="text-[#0F2651]">Referral code control</CardTitle></CardHeader><CardContent className="space-y-4">
            <form action={toggleReferralCodeStatusAction} className="space-y-4">
              <input type="hidden" name="redirect_to" value="/admin/wallet" />
              <input type="hidden" name="referral_profile_id" value={selectedReferral?.referralProfileId ?? ''} />
              <input type="hidden" name="mode" value={selectedReferral?.isDisabled ? 'enable' : 'disable'} />
              <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Disable reason</label><Textarea name="disable_reason" defaultValue={selectedReferral?.disabledReason ?? ''} placeholder="Required when disabling a code" /></div>
              <Button type="submit" disabled={!selectedReferral} className={selectedReferral?.isDisabled ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-600 text-white hover:bg-red-700'}>{selectedReferral?.isDisabled ? 'Re-enable referral code' : 'Disable referral code'}</Button>
            </form>
          </CardContent></Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <Card className="border-slate-200 bg-white"><CardHeader><CardTitle className="text-[#0F2651]">Promotion campaigns</CardTitle><CardDescription>Create and manage time-limited credit campaigns without leaving the admin area.</CardDescription></CardHeader><CardContent className="space-y-4">{promotionCampaigns.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">No promotion campaigns yet. Create the first one from the form beside this panel.</div> : promotionCampaigns.map((campaign) => <div key={campaign.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-lg font-semibold text-[#0F2651]">{campaign.name}</p><p className="text-sm text-slate-600">{campaign.code ? `Code ${campaign.code}` : 'No promo code'} • {campaign.rewardCredits} credits</p></div><Badge className={badgeTone(campaign.status)}>{campaign.status}</Badge></div><div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><p>Starts: {campaign.startsAt ? formatAdminDateTime(campaign.startsAt) : 'Not scheduled'}</p><p>Ends: {campaign.endsAt ? formatAdminDateTime(campaign.endsAt) : 'No expiry set'}</p><p>Max redemptions: {campaign.maxRedemptions ?? 'Unlimited'}</p><p>Updated: {formatAdminDateTime(campaign.updatedAt)}</p></div>{campaign.adminNote ? <p className="mt-3 text-sm text-slate-600">Admin note: {campaign.adminNote}</p> : null}<form action={updatePromotionCampaignStatusAction} className="mt-4 space-y-3"><input type="hidden" name="redirect_to" value="/admin/wallet" /><input type="hidden" name="campaign_id" value={campaign.id} /><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Status</label><select name="status" defaultValue={campaign.status} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"><option value="draft">draft</option><option value="active">active</option><option value="expired">expired</option><option value="cancelled">cancelled</option></select></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Admin note</label><Textarea name="admin_note" defaultValue={campaign.adminNote ?? ''} placeholder="Optional status change note" /></div><Button type="submit" className="bg-[#36689e] text-white hover:bg-[#0F2651]">Update campaign</Button></form></div>)}</CardContent></Card>

        <Card className="border-slate-200 bg-white"><CardHeader><CardTitle className="text-[#0F2651]">Create promotion campaign</CardTitle><CardDescription>Launch time-limited Catcher Security Credit campaigns for growth, support, or seasonal pushes.</CardDescription></CardHeader><CardContent>
          <form action={createPromotionCampaignAction} className="space-y-4">
            <input type="hidden" name="redirect_to" value="/admin/wallet" />
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Campaign name</label><Input name="name" placeholder="Back-to-School Wallet Boost" required /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Campaign code</label><Input name="code" placeholder="Optional promo code" /></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Status</label><select name="status" defaultValue="draft" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"><option value="draft">draft</option><option value="active">active</option><option value="expired">expired</option><option value="cancelled">cancelled</option></select></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Reward credits</label><Input name="reward_credits" type="number" min="1" placeholder="50" required /></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Starts at</label><Input name="starts_at" type="datetime-local" /></div><div className="space-y-2"><label className="text-sm font-medium text-slate-700">Ends at</label><Input name="ends_at" type="datetime-local" /></div></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Max redemptions</label><Input name="max_redemptions" type="number" min="1" placeholder="Optional redemption cap" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Admin note</label><Textarea name="admin_note" placeholder="Why this campaign exists and how support should use it" /></div>
            <Button type="submit" className="bg-[#36689e] text-white hover:bg-[#0F2651]">Create campaign</Button>
          </form>
        </CardContent></Card>
      </section>
    </div>
  )
}
