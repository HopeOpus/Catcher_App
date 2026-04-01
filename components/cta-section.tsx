import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { buildSupportMailto } from '@/lib/support'

export function CTASection() {
  const supportLink = buildSupportMailto({
    subject: 'Catcher product enquiry',
    body: [
      'Hello Catcher team,',
      '',
      'I would like help getting started with Catcher.',
      '',
      'My question is about:',
      '- Registration',
      '- Pricing',
      '- Business use',
      '',
      'Thank you.',
    ].join('\n'),
  })

  return (
    <section className="bg-gradient-to-r from-[#336699] to-[#0F2651] py-20 text-white">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mb-6 text-4xl font-bold md:text-5xl">
          Ready to get your records
          <span className="block">organized and protected?</span>
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-blue-100">
          Start with a free account, register your property, and use one dashboard
          for ownership records, stolen reporting, and safer item verification.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="bg-white text-[#0F2651] hover:bg-slate-100">
            <Link href="/auth/signup">Create Free Account</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
            <Link href="/stolen-items">Browse Stolen Items</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10">
            <a href={supportLink}>Talk to Support</a>
          </Button>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-8 text-blue-100 sm:flex-row">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure and encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Fast setup</span>
          </div>
        </div>
      </div>
    </section>
  )
}
