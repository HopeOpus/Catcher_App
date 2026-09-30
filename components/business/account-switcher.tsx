'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, Loader2, Plus, User } from 'lucide-react';
import { switchAccountAction } from '@/app/dashboard/business/actions';
import { VerificationBadge } from '@/components/business/verification-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ACCOUNT_CHANGED_EVENT,
  type AccountContextResponse,
} from '@/lib/business/account-context-types';
import { BUSINESS_ROLE_LABELS, PERSONAL_ACCOUNT_KEY } from '@/lib/business/constants';
import { cn } from '@/lib/utils';

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'C'
  );
}

function AccountAvatar({
  name,
  logoUrl,
  kind,
}: {
  name: string;
  logoUrl?: string | null;
  kind: 'personal' | 'business';
}) {
  return (
    <Avatar className="h-9 w-9 rounded-lg border border-slate-200">
      {logoUrl ? <AvatarImage src={logoUrl} alt="" className="object-cover" /> : null}
      <AvatarFallback
        className={cn(
          'rounded-lg text-xs font-semibold',
          kind === 'business' ? 'bg-[#0F2651] text-white' : 'bg-[#36689e]/10 text-[#0F2651]',
        )}
      >
        {kind === 'business' ? initials(name) : <User aria-hidden className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}

/** Paths that only make sense for a business; switching away leaves them. */
const BUSINESS_ONLY_PATHS = ['/dashboard/business'];

export function AccountSwitcher({
  context,
  onSwitched,
}: {
  context: AccountContextResponse | null;
  onSwitched?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingKey, setPendingKey] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  if (!context) {
    return (
      <div className="flex h-14.5 items-center gap-3 rounded-xl border border-slate-200 px-3" aria-busy>
        <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  const active = context.active;
  const activeKey = active.kind === 'business' ? active.businessId : PERSONAL_ACCOUNT_KEY;
  const activeName = active.kind === 'business' ? active.name : context.personal.name;

  const handleSwitch = async (key: string) => {
    if (key === activeKey || pendingKey) {
      return;
    }

    setPendingKey(key);
    setError(null);
    const result = await switchAccountAction(key);
    setPendingKey(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    window.dispatchEvent(new Event(ACCOUNT_CHANGED_EVENT));
    onSwitched?.();

    const leavingBusinessPage =
      key === PERSONAL_ACCOUNT_KEY &&
      BUSINESS_ONLY_PATHS.some((path) => pathname.startsWith(path));

    if (leavingBusinessPage) {
      router.push('/dashboard');
    }

    router.refresh();
  };

  return (
    <div className="space-y-1">
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex w-full min-h-14.5 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:border-[#36689e]/40 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#36689e] focus-visible:ring-offset-2"
          aria-label={`Active account: ${activeName}. Switch account`}
        >
          <AccountAvatar
            name={activeName}
            logoUrl={active.kind === 'business' ? active.logoUrl : null}
            kind={active.kind}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-[#0F2651]">{activeName}</span>
            <span className="block truncate text-xs text-slate-500">
              {active.kind === 'business'
                ? `Business · ${BUSINESS_ROLE_LABELS[active.role]}`
                : 'Personal account'}
            </span>
          </span>
          {pendingKey ? (
            <Loader2 aria-hidden className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
          ) : (
            <ChevronsUpDown aria-hidden className="h-4 w-4 shrink-0 text-slate-400" />
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-64">
          <DropdownMenuLabel className="text-xs font-medium text-slate-500">Personal</DropdownMenuLabel>
          <DropdownMenuItem
            className="cursor-pointer gap-3 py-2"
            onSelect={() => void handleSwitch(PERSONAL_ACCOUNT_KEY)}
          >
            <AccountAvatar name={context.personal.name} kind="personal" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{context.personal.name}</span>
              <span className="block truncate text-xs text-slate-500">{context.personal.email}</span>
            </span>
            {activeKey === PERSONAL_ACCOUNT_KEY ? (
              <Check aria-label="Active" className="h-4 w-4 text-[#36689e]" />
            ) : null}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-medium text-slate-500">Businesses</DropdownMenuLabel>
          {context.businesses.length === 0 ? (
            <p className="px-2 pb-2 text-xs leading-5 text-slate-500">
              Register your company to protect business assets and work as a team.
            </p>
          ) : (
            context.businesses.map((business) => (
              <DropdownMenuItem
                key={business.businessId}
                className="cursor-pointer gap-3 py-2"
                onSelect={() => void handleSwitch(business.businessId)}
              >
                <AccountAvatar name={business.name} logoUrl={business.logoUrl} kind="business" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{business.name}</span>
                  <span className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">{BUSINESS_ROLE_LABELS[business.role]}</span>
                    <VerificationBadge status={business.verificationStatus} size="sm" />
                  </span>
                </span>
                {activeKey === business.businessId ? (
                  <Check aria-label="Active" className="h-4 w-4 text-[#36689e]" />
                ) : null}
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer gap-2 py-2 text-[#0F2651]">
            <Link href="/dashboard/business/register" onClick={onSwitched}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-slate-300">
                <Plus aria-hidden className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium">Register a business</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {error ? (
        <p role="alert" className="px-1 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
