import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type AdminPageSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export function formatAdminDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatAdminDate(value: Date | string | null | undefined) {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export async function getAdminPageNotice(searchParams?: AdminPageSearchParams) {
  const resolved = searchParams ? await searchParams : {};
  const messageValue = resolved.message;
  const statusValue = resolved.status;
  const message =
    typeof messageValue === 'string' && messageValue.trim().length > 0
      ? messageValue.trim()
      : null;
  const tone =
    statusValue === 'success' || statusValue === 'error'
      ? statusValue
      : null;

  if (!message || !tone) {
    return null;
  }

  return {
    tone,
    message,
  } as const;
}

export function AdminPageNotice({
  notice,
}: {
  notice:
    | {
        tone: 'success' | 'error';
        message: string;
      }
    | null;
}) {
  if (!notice) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-4 text-sm ${
        notice.tone === 'success'
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      {notice.message}
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-[#0F2651]">{title}</h1>
        <p className="mt-2 max-w-3xl text-slate-600">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Button asChild className="bg-[#36689e] text-white hover:bg-[#0F2651]">
          <Link href={actionHref}>
            {actionLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
