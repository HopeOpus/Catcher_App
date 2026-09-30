'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  FileCheck2,
  Loader2,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { registerBusinessAction } from '@/app/dashboard/business/actions';
import {
  BUSINESS_FORM_SECTIONS,
  BusinessFormSectionFields,
  EMPTY_BUSINESS_FORM,
  pickSectionErrors,
  type BusinessFormErrors,
  type BusinessFormSection,
  type BusinessFormValues,
} from '@/components/business/business-form-fields';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ACCOUNT_CHANGED_EVENT } from '@/lib/business/account-context-types';
import { BUSINESS_TYPE_LABELS, isBusinessType } from '@/lib/business/constants';
import { validateBusinessProfile } from '@/lib/business/validation';
import { cn } from '@/lib/utils';

const STEPS: Array<{
  section: BusinessFormSection;
  title: string;
  description: string;
  icon: typeof Building2;
}> = [
  {
    section: 'identity',
    title: 'Business identity',
    description: 'Tell us who the business is, as registered with the CAC.',
    icon: Building2,
  },
  {
    section: 'contact',
    title: 'Contact & address',
    description: 'Where to reach the business and where it operates from.',
    icon: MapPin,
  },
  {
    section: 'documents',
    title: 'Verification',
    description: 'Upload your CAC certificate so we can verify the business.',
    icon: FileCheck2,
  },
];

type Pricing = { monthly: string; yearly: string };

export default function RegisterBusinessClient({
  pricing,
  defaultEmail,
}: {
  pricing: Pricing;
  defaultEmail: string;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = React.useState(0);
  const [values, setValues] = React.useState<BusinessFormValues>({
    ...EMPTY_BUSINESS_FORM,
    email: defaultEmail,
  });
  const [errors, setErrors] = React.useState<BusinessFormErrors>({});
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const handleChange = <K extends keyof BusinessFormValues>(field: K, value: BusinessFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const goToStep = (index: number) => {
    setStepIndex(index);
    setFormError(null);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const validateStep = (section: BusinessFormSection) => {
    const result = validateBusinessProfile(values);
    const sectionErrors = result.ok ? {} : pickSectionErrors(section, result.fieldErrors);
    setErrors(sectionErrors);

    if (Object.keys(sectionErrors).length > 0) {
      const firstField = BUSINESS_FORM_SECTIONS[section].find((field) => field in sectionErrors);
      document.getElementById(firstField ?? '')?.focus();
      return false;
    }

    return true;
  };

  const handleContinue = () => {
    if (validateStep(step.section)) {
      goToStep(stepIndex + 1);
    }
  };

  const handleSubmit = async () => {
    if (!acceptedTerms) {
      setFormError('Confirm that you are authorised to register this business on its behalf.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const result = await registerBusinessAction({ ...values, acceptedTerms });

    if (!result.ok) {
      setIsSubmitting(false);
      setFormError(result.error);

      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
        const firstInvalid = STEPS.findIndex(
          ({ section }) => Object.keys(pickSectionErrors(section, result.fieldErrors ?? {})).length > 0,
        );

        if (firstInvalid >= 0 && firstInvalid !== stepIndex) {
          goToStep(firstInvalid);
        }
      }

      return;
    }

    window.dispatchEvent(new Event(ACCOUNT_CHANGED_EVENT));
    router.push('/dashboard/business?welcome=1');
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-[#0F2651]"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Back to dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0F2651]">Register your business</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Protect company assets under your business name, bring your team in, and get a Verified Business badge once
          we confirm your CAC registration.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* Step indicator */}
          <nav aria-label="Registration progress">
            <p className="mb-3 text-sm font-medium text-slate-500">
              Step {stepIndex + 1} of {STEPS.length}
            </p>
            <ol className="grid grid-cols-3 gap-2">
              {STEPS.map((item, index) => {
                const isComplete = index < stepIndex;
                const isCurrent = index === stepIndex;

                return (
                  <li key={item.section}>
                    <button
                      type="button"
                      disabled={index > stepIndex || isSubmitting}
                      onClick={() => goToStep(index)}
                      aria-current={isCurrent ? 'step' : undefined}
                      className="group flex w-full flex-col gap-2 text-left disabled:cursor-default enabled:cursor-pointer"
                    >
                      <span
                        className={cn(
                          'h-1.5 w-full rounded-full transition-colors duration-300',
                          isComplete || isCurrent ? 'bg-[#36689e]' : 'bg-slate-200',
                        )}
                      />
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                            isComplete
                              ? 'bg-[#36689e] text-white'
                              : isCurrent
                                ? 'border-2 border-[#36689e] text-[#0F2651]'
                                : 'border border-slate-300 text-slate-500',
                          )}
                        >
                          {isComplete ? <Check aria-hidden className="h-3.5 w-3.5" /> : index + 1}
                        </span>
                        <span
                          className={cn(
                            'hidden text-sm font-medium sm:inline',
                            isCurrent || isComplete ? 'text-[#0F2651]' : 'text-slate-500',
                            'group-enabled:group-hover:underline',
                          )}
                        >
                          {item.title}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#36689e]/10">
                  <step.icon aria-hidden className="h-5 w-5 text-[#36689e]" />
                </span>
                <div>
                  <CardTitle>
                    <h2 ref={headingRef} tabIndex={-1} className="text-xl text-[#0F2651] outline-none">
                      {step.title}
                    </h2>
                  </CardTitle>
                  <CardDescription className="mt-1">{step.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <BusinessFormSectionFields
                section={step.section}
                values={values}
                errors={errors}
                onChange={handleChange}
              />

              {isLastStep ? (
                <div className="space-y-4">
                  {!values.cacDocumentUrl ? (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      No certificate yet? You can register now and upload it later from Business Profile. The
                      Verified Business badge appears only after we review the document.
                    </p>
                  ) : null}
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Business</dt>
                      <dd className="mt-0.5 font-medium text-[#0F2651]">{values.name || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">CAC number</dt>
                      <dd className="mt-0.5 font-medium uppercase text-[#0F2651]">
                        {values.registrationNumber || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Type</dt>
                      <dd className="mt-0.5 text-slate-700">
                        {isBusinessType(values.businessType) ? BUSINESS_TYPE_LABELS[values.businessType] : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Location</dt>
                      <dd className="mt-0.5 text-slate-700">
                        {[values.city, values.state].filter(Boolean).join(', ') || '—'}
                      </dd>
                    </div>
                  </dl>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) => {
                        setAcceptedTerms(event.target.checked);
                        setFormError(null);
                      }}
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-[#36689e]"
                    />
                    <span className="text-sm leading-6 text-slate-700">
                      I am authorised to register this business on Catcher, and the details and documents I have
                      provided are accurate. I agree to the{' '}
                      <Link href="/legal/terms" target="_blank" className="font-medium text-[#36689e] underline-offset-2 hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/legal/privacy" target="_blank" className="font-medium text-[#36689e] underline-offset-2 hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                </div>
              ) : null}

              {formError ? (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 cursor-pointer"
                  disabled={stepIndex === 0 || isSubmitting}
                  onClick={() => goToStep(stepIndex - 1)}
                >
                  <ArrowLeft aria-hidden className="mr-2 h-4 w-4" />
                  Back
                </Button>

                {isLastStep ? (
                  <Button
                    type="button"
                    className="h-11 cursor-pointer bg-[#0F2651] px-6 text-white hover:bg-[#36689e]"
                    disabled={isSubmitting}
                    onClick={() => void handleSubmit()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 aria-hidden className="mr-2 h-4 w-4 animate-spin" />
                        Registering business…
                      </>
                    ) : values.cacDocumentUrl ? (
                      'Register and submit for verification'
                    ) : (
                      'Register without documents for now'
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="h-11 cursor-pointer bg-[#0F2651] px-6 text-white hover:bg-[#36689e]"
                    onClick={handleContinue}
                  >
                    Continue
                    <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4" aria-label="About business accounts">
          <Card className="overflow-hidden border-0 bg-[linear-gradient(145deg,#0F2651_0%,#1b4f8f_100%)] text-white shadow-lg">
            <CardContent className="space-y-5 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Business plans</p>
                <p className="mt-3 text-3xl font-semibold">{pricing.yearly}</p>
                <p className="text-sm text-blue-100">per asset, per year · or {pricing.monthly} monthly</p>
              </div>
              <ul className="space-y-3 text-sm text-blue-50">
                {[
                  { icon: ShieldCheck, text: 'Every asset registered under your business name' },
                  { icon: Users, text: 'Invite staff as admins, members or read-only viewers' },
                  { icon: BadgeCheck, text: 'Verified Business badge in the public registry' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex gap-3">
                    <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="space-y-3 p-5 text-sm text-slate-600">
              <p className="font-semibold text-[#0F2651]">How verification works</p>
              <ol className="space-y-2">
                <li className="flex gap-2">
                  <span className="font-semibold text-[#36689e]">1.</span>
                  Register now and start adding assets straight away.
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-[#36689e]">2.</span>
                  Our team checks your CAC certificate, usually within 1–2 business days.
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-[#36689e]">3.</span>
                  Once approved, the Verified Business badge appears on all your assets.
                </li>
              </ol>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
