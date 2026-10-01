'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Circle,
  Clock3,
  FileCheck2,
  Loader2,
  MapPin,
  PartyPopper,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { updateBusinessAction } from '@/app/dashboard/business/actions';
import {
  BusinessFormSectionFields,
  type BusinessFormErrors,
  type BusinessFormSection,
  type BusinessFormValues,
} from '@/components/business/business-form-fields';
import { VerificationBadge } from '@/components/business/verification-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BUSINESS_ROLE_LABELS,
  BUSINESS_TYPE_LABELS,
  type BusinessMemberRoleValue,
  type BusinessTypeValue,
  type BusinessVerificationStatusValue,
} from '@/lib/business/constants';
import { cn } from '@/lib/utils';

type BusinessProfile = BusinessFormValues & {
  slug: string;
  verificationStatus: BusinessVerificationStatusValue;
  verificationNote: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
    : null;
}

function VerificationTimeline({ business }: { business: BusinessProfile }) {
  const status = business.verificationStatus;
  const steps = [
    { label: 'Business registered', detail: formatDate(business.createdAt), done: true },
    {
      label: 'CAC document submitted',
      detail: business.cacDocumentUrl ? formatDate(business.submittedAt) : 'Waiting for upload',
      done: Boolean(business.cacDocumentUrl) && status !== 'unsubmitted',
    },
    {
      label: status === 'rejected' ? 'Review: changes needed' : 'Reviewed by Catcher',
      detail:
        status === 'verified'
          ? formatDate(business.verifiedAt)
          : status === 'pending'
            ? 'Usually 1–2 business days'
            : status === 'rejected'
              ? 'Update the details below'
              : null,
      done: status === 'verified',
      current: status === 'pending' || status === 'rejected',
    },
  ];

  return (
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li key={step.label} className="relative flex gap-3">
          {index < steps.length - 1 ? (
            <span
              aria-hidden
              className={cn(
                'absolute left-2.25 top-6 h-[calc(100%-4px)] w-0.5',
                step.done ? 'bg-[#36689e]' : 'bg-slate-200',
              )}
            />
          ) : null}
          {step.done ? (
            <CheckCircle2 aria-hidden className="relative h-5 w-5 shrink-0 text-[#36689e]" />
          ) : step.current ? (
            <Clock3
              aria-hidden
              className={cn('relative h-5 w-5 shrink-0', status === 'rejected' ? 'text-red-500' : 'text-amber-500')}
            />
          ) : (
            <Circle aria-hidden className="relative h-5 w-5 shrink-0 text-slate-300" />
          )}
          <div className="-mt-0.5">
            <p className={cn('text-sm font-medium', step.done || step.current ? 'text-[#0F2651]' : 'text-slate-500')}>
              {step.label}
            </p>
            {step.detail ? <p className="text-xs text-slate-500">{step.detail}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

const SECTIONS: Array<{ section: BusinessFormSection; title: string; description: string; icon: typeof Building2 }> = [
  {
    section: 'identity',
    title: 'Business identity',
    description: 'Changing the name, type or CAC number sends the business back for verification.',
    icon: Building2,
  },
  { section: 'contact', title: 'Contact & address', description: 'Used on receipts and for account notices.', icon: MapPin },
  {
    section: 'documents',
    title: 'Documents & branding',
    description: 'Uploading a new certificate sends the business for review.',
    icon: FileCheck2,
  },
];

export default function BusinessProfileClient({
  business,
  stats,
  canEdit,
  role,
  isWelcome,
}: {
  business: BusinessProfile;
  stats: { assetCount: number; activeCoverageCount: number; memberCount: number };
  canEdit: boolean;
  role: BusinessMemberRoleValue;
  isWelcome: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = React.useState<BusinessFormValues>(business);
  const [errors, setErrors] = React.useState<BusinessFormErrors>({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const isDirty = (Object.keys(values) as Array<keyof BusinessFormValues>).some(
    (field) => (values[field] ?? '') !== (business[field] ?? ''),
  );

  const handleChange = <K extends keyof BusinessFormValues>(field: K, value: BusinessFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setNotice(null);

    const result = await updateBusinessAction(values);
    setIsSaving(false);

    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setNotice({ tone: 'error', message: result.error });
      return;
    }

    setErrors({});
    setNotice({ tone: 'success', message: result.message ?? 'Saved.' });
    router.refresh();
  };

  const status = business.verificationStatus;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logoUrl}
              alt=""
              className="h-16 w-16 rounded-2xl border border-slate-200 bg-white object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F2651] text-xl font-semibold text-white">
              {business.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#0F2651] sm:text-3xl">{business.name}</h1>
              <VerificationBadge status={status} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {business.registrationNumber} · {BUSINESS_TYPE_LABELS[business.businessType as BusinessTypeValue]} · Your
              role: {BUSINESS_ROLE_LABELS[role]}
            </p>
          </div>
        </div>
        <Button asChild className="h-11 bg-[#0F2651] text-white hover:bg-[#36689e]">
          <Link href="/dashboard/properties">
            Manage assets
            <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {isWelcome ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <PartyPopper aria-hidden className="h-4 w-4" />
          <AlertTitle>{business.name} is set up</AlertTitle>
          <AlertDescription className="text-emerald-800">
            You are now working in your business account. Register your first asset, then invite your team.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Registered assets', value: stats.assetCount, icon: ShieldCheck, href: '/dashboard/properties' },
          { label: 'Active subscriptions', value: stats.activeCoverageCount, icon: BadgeCheck, href: '/dashboard/subscriptions' },
          { label: 'Team members', value: stats.memberCount, icon: Users, href: '/dashboard/business/team' },
        ].map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-[#36689e]/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#36689e]"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">{label}</p>
              <Icon aria-hidden className="h-4 w-4 text-[#36689e]" />
            </div>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-[#0F2651]">{value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-[#0F2651]">Verification</CardTitle>
            <CardDescription>
              {status === 'verified'
                ? 'Your assets show the Verified Business badge.'
                : 'You can register and protect assets while verification is in progress.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <VerificationTimeline business={business} />
            {status === 'rejected' && business.verificationNote ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <p className="font-medium">What to fix</p>
                <p className="mt-1">{business.verificationNote}</p>
              </div>
            ) : null}
            {status === 'unsubmitted' && canEdit ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Upload your CAC certificate under Documents &amp; branding to start verification.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <form onSubmit={handleSave} className="min-w-0 space-y-6" noValidate>
          <fieldset disabled={!canEdit || isSaving} className="space-y-6">
            {SECTIONS.map(({ section, title, description, icon: Icon }) => (
              <Card key={section} className="border-slate-200">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <Icon aria-hidden className="mt-0.5 h-5 w-5 text-[#36689e]" />
                    <div>
                      <CardTitle className="text-lg text-[#0F2651]">{title}</CardTitle>
                      <CardDescription className="mt-1">{description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <BusinessFormSectionFields section={section} values={values} errors={errors} onChange={handleChange} />
                </CardContent>
              </Card>
            ))}
          </fieldset>

          {canEdit ? (
            <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <p
                role={notice ? 'status' : undefined}
                className={cn(
                  'text-sm',
                  notice?.tone === 'error' ? 'text-red-600' : notice ? 'text-emerald-700' : 'text-slate-500',
                )}
              >
                {notice?.message ?? (isDirty ? 'You have unsaved changes.' : 'All changes saved.')}
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 cursor-pointer"
                  disabled={!isDirty || isSaving}
                  onClick={() => {
                    setValues(business);
                    setErrors({});
                    setNotice(null);
                  }}
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  className="h-11 cursor-pointer bg-[#0F2651] px-6 text-white hover:bg-[#36689e]"
                  disabled={!isDirty || isSaving}
                >
                  {isSaving ? <Loader2 aria-hidden className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save changes
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Only business owners and admins can edit these details.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
