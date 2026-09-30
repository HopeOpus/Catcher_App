import { BadgeCheck, Clock3, FileWarning, ShieldAlert } from 'lucide-react';
import {
  BUSINESS_VERIFICATION_LABELS,
  type BusinessVerificationStatusValue,
} from '@/lib/business/constants';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<
  BusinessVerificationStatusValue,
  { className: string; icon: typeof BadgeCheck }
> = {
  verified: { className: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: BadgeCheck },
  pending: { className: 'border-amber-200 bg-amber-50 text-amber-800', icon: Clock3 },
  unsubmitted: { className: 'border-slate-200 bg-slate-50 text-slate-700', icon: FileWarning },
  rejected: { className: 'border-red-200 bg-red-50 text-red-700', icon: ShieldAlert },
};

export function VerificationBadge({
  status,
  size = 'md',
  className,
}: {
  status: BusinessVerificationStatusValue;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const { className: tone, icon: Icon } = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        tone,
        className,
      )}
    >
      <Icon aria-hidden className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {BUSINESS_VERIFICATION_LABELS[status]}
    </span>
  );
}

/** The public-facing mark shown next to verified business owners. */
export function VerifiedBusinessMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white',
        className,
      )}
    >
      <BadgeCheck aria-hidden className="h-3 w-3" />
      Verified Business
    </span>
  );
}
