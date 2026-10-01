import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ClipboardList,
  FileCheck2,
  Search,
  ShieldAlert,
  Tag,
  Users,
} from 'lucide-react';
import Footer from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { VerifiedBusinessMark } from '@/components/business/verification-badge';
import { Button } from '@/components/ui/button';
import {
  BUSINESS_MONTHLY_PROPERTY_PLAN_PRICE_NGN_KOBO,
  BUSINESS_YEARLY_PROPERTY_PLAN_PRICE_NGN_KOBO,
  PROPERTY_PLAN_GRACE_PERIOD_DAYS,
  formatNgnFromKobo,
} from '@/lib/property-plans';

export const metadata: Metadata = {
  title: 'Catcher for Business · Protect company assets',
  description:
    'Register company vehicles, laptops, equipment and other valuables under your business name, work as a team, and earn a Verified Business badge in the Catcher registry.',
};

const monthlyPrice = formatNgnFromKobo(BUSINESS_MONTHLY_PROPERTY_PLAN_PRICE_NGN_KOBO);
const yearlyPrice = formatNgnFromKobo(BUSINESS_YEARLY_PROPERTY_PLAN_PRICE_NGN_KOBO);

const BENEFITS = [
  {
    icon: Building2,
    title: 'Assets in the company name',
    body: 'Every vehicle, laptop and piece of equipment is registered to the business, not to whichever employee added it. Staff changes never take your records with them.',
  },
  {
    icon: Users,
    title: 'Your whole team, the right access',
    body: 'Invite colleagues as admins, members or read-only viewers. Everyone works from one shared asset list, and every change is logged.',
  },
  {
    icon: BadgeCheck,
    title: 'A Verified Business badge',
    body: 'Once we confirm your CAC registration, buyers and the public see that your assets belong to a verified business when they search the registry.',
  },
  {
    icon: Tag,
    title: 'Asset tags and branches',
    body: 'Record your own inventory numbers and where each asset is kept, then search across everything in seconds.',
  },
  {
    icon: ShieldAlert,
    title: 'Theft reporting that sticks',
    body: 'File a stolen report for any company asset. It shows up instantly to anyone who checks the serial number on Catcher.',
  },
  {
    icon: ClipboardList,
    title: 'Receipts ready for accounts',
    body: 'Receipts carry your business name, CAC number, TIN and address, so finance can file them without rework.',
  },
];

const STEPS = [
  { icon: Building2, title: 'Register the business', body: 'Enter your CAC details and head office address. It takes about three minutes.' },
  { icon: FileCheck2, title: 'Upload your CAC certificate', body: 'We review it, usually within 1–2 business days. You can register assets in the meantime.' },
  { icon: Users, title: 'Add assets and invite your team', body: 'Register assets one by one, then bring in the colleagues who manage them.' },
];

const FAQS = [
  {
    q: 'Can I use Catcher for my business before verification finishes?',
    a: 'Yes. You can register and pay for assets immediately. The Verified Business badge appears on them once our team approves your CAC document.',
  },
  {
    q: 'What does verification check?',
    a: 'We check that the business name, registration type and CAC number on your certificate match the details you entered. If something does not match, we tell you exactly what to fix.',
  },
  {
    q: 'Is there a free plan for businesses?',
    a: `No. Business assets are billed per asset at ${monthlyPrice} a month or ${yearlyPrice} a year. Your personal Catcher account keeps its own free registration.`,
  },
  {
    q: 'What happens when an employee leaves?',
    a: 'Remove them from the team. The assets they registered stay with the business and are reassigned to an owner automatically.',
  },
  {
    q: 'Can I keep my personal account?',
    a: 'Yes. Business and personal accounts live side by side. Switch between them from the account menu in your dashboard.',
  },
];

export default function BusinessLandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Navigation />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0b1c3f_0%,#12386d_50%,#1b4f8f_100%)] pb-20 pt-32 text-white sm:pb-28">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(120,186,255,0.18),transparent_30%)]"
          />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
            <div className="space-y-7">
              <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">
                Catcher for Business
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Protect every company asset under one verified name
              </h1>
              <p className="max-w-xl text-lg leading-8 text-blue-50/90">
                Register fleets, laptops, equipment and valuables to your business, manage them with your team, and
                show buyers and the public that your records come from a verified company.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 bg-white px-6 text-[#0F2651] hover:bg-blue-50">
                  <Link href="/dashboard/business/register">
                    Register your business
                    <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="#pricing">See pricing</Link>
                </Button>
              </div>
              <p className="text-sm text-blue-100/80">
                Sign in or create a Catcher account first. Your personal account stays separate.
              </p>
            </div>

            {/* Product preview */}
            <div aria-hidden className="relative">
              <div className="rounded-[28px] border border-white/15 bg-white/10 p-4 shadow-[0_30px_80px_rgba(7,15,37,0.35)] backdrop-blur-md sm:p-6">
                <div className="rounded-2xl bg-white p-5 text-slate-900 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F2651] font-semibold text-white">
                      A
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#0F2651]">Adewale Logistics Ltd</p>
                      <VerifiedBusinessMark className="mt-1" />
                    </div>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {[
                      { name: 'Toyota Hiace 2021', tag: 'FLEET-0042', place: 'Ikeja depot', status: 'Active' },
                      { name: 'MacBook Pro 14"', tag: 'IT-0117', place: 'Lekki HQ', status: 'Active' },
                      { name: 'Generator 60kVA', tag: 'PLT-0009', place: 'Apapa yard', status: 'Stolen' },
                    ].map((asset) => (
                      <li key={asset.tag} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#0F2651]">{asset.name}</p>
                          <p className="truncate text-xs text-slate-500">
                            <span className="font-mono">{asset.tag}</span> · {asset.place}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            asset.status === 'Stolen' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {asset.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> 6 team members
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5" /> Searchable in the registry
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 sm:py-24" aria-labelledby="business-benefits">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 id="business-benefits" className="text-3xl font-semibold tracking-tight text-[#0F2651] sm:text-4xl">
                Built for how companies own things
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Personal accounts protect one person&apos;s valuables. Business accounts protect assets that many people
                use and nobody should be able to walk away with.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition-shadow duration-200 hover:shadow-md"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#36689e]/10">
                    <Icon aria-hidden className="h-5 w-5 text-[#36689e]" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-[#0F2651]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-slate-50 py-20 sm:py-24" aria-labelledby="business-steps">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 id="business-steps" className="text-3xl font-semibold tracking-tight text-[#0F2651] sm:text-4xl">
              Set up in an afternoon
            </h2>
            <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, body }, index) => (
                <li key={title} className="relative rounded-2xl border border-slate-200 bg-white p-6">
                  <span className="text-sm font-semibold text-[#36689e]">Step {index + 1}</span>
                  <Icon aria-hidden className="mt-4 h-6 w-6 text-[#0F2651]" />
                  <h3 className="mt-3 text-lg font-semibold text-[#0F2651]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-24 py-20 sm:py-24" aria-labelledby="business-pricing">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 id="business-pricing" className="text-3xl font-semibold tracking-tight text-[#0F2651] sm:text-4xl">
                Simple per-asset pricing
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                Pay only for the assets you protect. No seat fees, no setup fees, and a {PROPERTY_PLAN_GRACE_PERIOD_DAYS}
                -day grace period on every renewal.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
              {[
                {
                  name: 'Business Monthly',
                  price: monthlyPrice,
                  period: 'per asset / month',
                  note: 'Flexible cover for short-term or rotating assets.',
                  highlighted: false,
                },
                {
                  name: 'Business Yearly',
                  price: yearlyPrice,
                  period: 'per asset / year',
                  note: 'Best value for fleets and long-lived equipment.',
                  highlighted: true,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-3xl border-2 p-8 ${
                    plan.highlighted ? 'border-[#36689e] bg-[#f0f5fa] shadow-lg' : 'border-slate-200 bg-white'
                  }`}
                >
                  {plan.highlighted ? (
                    <span className="absolute -top-3 left-8 rounded-full bg-[#0F2651] px-3 py-1 text-xs font-semibold text-white">
                      Best value
                    </span>
                  ) : null}
                  <h3 className="text-lg font-semibold text-[#0F2651]">{plan.name}</h3>
                  <p className="mt-4">
                    <span className="text-4xl font-bold tabular-nums text-[#0F2651]">{plan.price}</span>
                    <span className="ml-2 text-slate-600">{plan.period}</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{plan.note}</p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-700">
                    {[
                      'Registered under your business name',
                      'Unlimited team members',
                      'Verified Business badge after CAC review',
                      'Theft alerts and stolen reporting',
                      'Receipts with CAC number and TIN',
                    ].map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <Check aria-hidden className="h-5 w-5 shrink-0 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`mt-8 h-11 w-full ${
                      plan.highlighted
                        ? 'bg-[#0F2651] text-white hover:bg-[#36689e]'
                        : 'border border-slate-300 bg-white text-[#0F2651] hover:bg-slate-50'
                    }`}
                  >
                    <Link href="/dashboard/business/register">Register your business</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-slate-50 py-20 sm:py-24" aria-labelledby="business-faq">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 id="business-faq" className="text-3xl font-semibold tracking-tight text-[#0F2651]">
              Questions businesses ask
            </h2>
            <div className="mt-10 space-y-3">
              {FAQS.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 open:shadow-sm [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-[#0F2651]">
                    {q}
                    <span
                      aria-hidden
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform duration-200 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start gap-6 rounded-3xl bg-[#0F2651] p-8 text-white sm:p-12 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold sm:text-3xl">Ready to protect your company&apos;s assets?</h2>
                <p className="mt-2 text-blue-100">Register now and start adding assets today.</p>
              </div>
              <Button asChild size="lg" className="h-12 shrink-0 bg-white px-6 text-[#0F2651] hover:bg-blue-50">
                <Link href="/dashboard/business/register">
                  Register your business
                  <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
