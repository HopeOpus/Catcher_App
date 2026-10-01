import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, Clock3, MailWarning, ShieldCheck, XCircle } from 'lucide-react';
import { VerificationBadge } from '@/components/business/verification-badge';
import { Button } from '@/components/ui/button';
import { getAuthenticatedAppUser } from '@/lib/authenticated-user';
import { BUSINESS_ROLE_DESCRIPTIONS, BUSINESS_ROLE_LABELS } from '@/lib/business/constants';
import { getInvitePreview } from '@/lib/business/service';
import AcceptInviteButton from './accept-invite-button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Business invitation · Catcher',
  robots: { index: false, follow: false },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2" aria-label="Catcher home">
          <Image src="/catcher-logo.svg" alt="" width={140} height={36} className="h-9 w-auto" priority />
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">{children}</div>
      </div>
    </main>
  );
}

function StateMessage({
  icon: Icon,
  tone,
  title,
  body,
}: {
  icon: typeof XCircle;
  tone: 'red' | 'amber';
  title: string;
  body: string;
}) {
  return (
    <Shell>
      <div className="space-y-4 text-center">
        <span
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${
            tone === 'red' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
          }`}
        >
          <Icon aria-hidden className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-semibold text-[#0F2651]">{title}</h1>
        <p className="text-sm leading-6 text-slate-600">{body}</p>
        <Button asChild variant="outline" className="h-11 w-full">
          <Link href="/dashboard">Go to your dashboard</Link>
        </Button>
      </div>
    </Shell>
  );
}

export default async function BusinessInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [invite, user] = await Promise.all([getInvitePreview(token), getAuthenticatedAppUser()]);

  if (!invite || invite.status === 'revoked') {
    return (
      <StateMessage
        icon={XCircle}
        tone="red"
        title="This invitation is not valid"
        body="The link may have been replaced by a newer invitation or withdrawn. Ask the business to send you a new one."
      />
    );
  }

  if (invite.status === 'expired') {
    return (
      <StateMessage
        icon={Clock3}
        tone="amber"
        title="This invitation has expired"
        body={`Invitations last 7 days. Ask ${invite.invitedBy.name} to invite you to ${invite.business.name} again.`}
      />
    );
  }

  if (invite.status === 'accepted') {
    return (
      <StateMessage
        icon={ShieldCheck}
        tone="amber"
        title="Invitation already accepted"
        body={`This invitation to ${invite.business.name} has already been used. If it was you, switch to the business from your dashboard.`}
      />
    );
  }

  const invitePath = `/business/invite/${encodeURIComponent(token)}`;
  const emailMatches = user?.candidateEmails.includes(invite.email) ?? false;

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          {invite.business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={invite.business.logoUrl} alt="" className="h-16 w-16 rounded-2xl border border-slate-200 object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F2651] text-white">
              <Building2 aria-hidden className="h-7 w-7" />
            </span>
          )}
          <div>
            <p className="text-sm text-slate-500">{invite.invitedBy.name} invited you to join</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0F2651]">{invite.business.name}</h1>
          </div>
          <VerificationBadge status={invite.business.verificationStatus} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Your role</p>
          <p className="mt-1 font-semibold text-[#0F2651]">{BUSINESS_ROLE_LABELS[invite.role]}</p>
          <p className="mt-1 text-sm text-slate-600">{BUSINESS_ROLE_DESCRIPTIONS[invite.role]}</p>
        </div>

        {!user ? (
          <div className="space-y-3">
            <p className="text-center text-sm text-slate-600">
              Sign in or create an account with <span className="font-medium text-[#0F2651]">{invite.email}</span> to
              accept.
            </p>
            <Button asChild className="h-11 w-full bg-[#0F2651] text-white hover:bg-[#36689e]">
              <Link href={`/auth/signin?redirect_url=${encodeURIComponent(invitePath)}`}>Sign in to accept</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 w-full">
              <Link href={`/auth/signup?redirect_url=${encodeURIComponent(invitePath)}`}>Create an account</Link>
            </Button>
          </div>
        ) : emailMatches ? (
          <AcceptInviteButton token={token} businessName={invite.business.name} />
        ) : (
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <MailWarning aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              This invitation was sent to <span className="font-semibold">{invite.email}</span>, but you are signed in
              as <span className="font-semibold">{user.email}</span>. Sign in with the invited address to accept it.
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}
