import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { buildSupportMailto } from '@/lib/support'

export function PricingSection() {
  const enterpriseContactLink = buildSupportMailto({
    subject: 'Catcher Enterprise plan enquiry',
    body: [
      'Hello Catcher team,',
      '',
      'I would like to learn more about the Enterprise plan.',
      '',
      'Organisation or use case:',
      'Number of assets or users:',
      'What I need help with:',
      '',
      'Thank you.',
    ].join('\n'),
  })

  const plans = [
    {
      name: 'Free To Start',
      price: 'Free',
      period: '',
      description: 'Start with one property and free basic protection.',
      features: [
        'Register one property for free',
        'Property dashboard access',
        'Email support',
        '12 months service duration',
        'Theft alerts',
        'Basic stolen reporting',
        'Obtain a global digital identity certificate ($1 only)',
      ],
      cta: 'Create Free Account',
      href: '/auth/signup',
      popular: false,
    },
    {
      name: '$2 Monthly',
      price: '$2',
      period: 'Monthly',
      description: 'Monthly protection with a free digital identity certificate.',
      features: [
        'Property dashboard access',
        'Email support',
        '1 months service duration',
        'Theft alerts',
        'Basic stolen reporting',
        'Obtain a global digital identity certificate (Free)',
      ],
      cta: 'Start with Catcher',
      href: '/auth/signup',
      popular: false,
    },
    {
      name: '$8 Annually',
      price: '$8',
      period: 'Annually',
      description: 'Recommended annual protection with a free global identity certificate.',
      features: [
        'Property dashboard access',
        'Email support',
        '12 months service duration',
        'Theft alerts',
        'Basic stolen reporting',
        'Obtain a global digital identity certificate (Free)',
      ],
      cta: 'Start with Catcher',
      href: '/auth/signup',
      popular: true,
    },
  ]

  return (
    <section id="pricing" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-[#0F2651] md:text-5xl">
            Simple, Transparent
            <span className="block bg-gradient-to-r from-[#336699] to-[#0F2651] bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-slate-600">
            Choose the plan that fits your needs. Public pricing matches the real
            subscription options available inside Catcher.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 bg-gradient-to-br from-white to-slate-50 p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                plan.popular
                  ? 'border-[#36689e]/50 bg-gradient-to-br from-[#f0f5fa] to-white'
                  : 'border-slate-200/50'
              }`}>
              {plan.popular ? (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                  <span className="rounded-full bg-gradient-to-r from-[#336699] to-[#0F2651] px-4 py-1 text-sm font-medium text-white">
                    Recommended
                  </span>
                </div>
              ) : null}

              <div className="mb-8 text-center">
                <h3 className="mb-2 text-2xl font-bold text-slate-900">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="ml-2 text-slate-600">{plan.period}</span>
                </div>
                <p className="text-sm text-slate-600">{plan.description}</p>
              </div>

              <ul className="mb-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`w-full border-radius-2xl py-3 text-lg font-semibold transition-all duration-200 hover:-translate-y-1 ${
                  plan.popular
                    ? 'border-[#36689e] bg-gradient-to-r from-[#336699] to-[#0F2651] text-white'
                    : 'border-slate-300 bg-white text-[#0F2651]'
                }`}>
                {plan.name === 'Enterprise' ? (
                  <a href={plan.href}>{plan.cta}</a>
                ) : (
                  <Link href={plan.href}>{plan.cta}</Link>
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-600">
            Need help choosing a plan or billing path?{' '}
            <a href={enterpriseContactLink} className="font-medium text-[#36689e] hover:text-[#0F2651]">
              Contact the Catcher team
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
