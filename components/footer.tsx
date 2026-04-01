import Link from 'next/link'
import Image from 'next/image'
import { SUPPORT_EMAIL, buildSupportMailto } from '@/lib/support'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const supportLink = buildSupportMailto({
    subject: 'Catcher support request',
    body: [
      'Hello Catcher team,',
      '',
      'I would like help with:',
      '- Account access',
      '- Billing',
      '- Product questions',
      '',
      'Thank you.',
    ].join('\n'),
  })

  return (
    <footer className="bg-[#0F2651] py-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <Image
              src="/logo2.svg"
              alt="Catcher Logo"
              width={160}
              height={32}
              className="h-8 w-auto"
            />
            <p className="mt-4 max-w-md text-slate-400">
              Catcher helps you register valuable property, report stolen items, and
              check suspicious goods before purchase.
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Support:{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Explore</h3>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/#features" className="transition-colors hover:text-white">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="transition-colors hover:text-white">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="transition-colors hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/stolen-items" className="transition-colors hover:text-white">
                  Stolen Items
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Account</h3>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/auth/signin" className="transition-colors hover:text-white">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="transition-colors hover:text-white">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="transition-colors hover:text-white">
                  Dashboard
                </Link>
              </li>
              <li>
                <a href={supportLink} className="transition-colors hover:text-white">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between border-t border-slate-800 pt-8 md:flex-row">
          <p className="text-slate-400">© {currentYear} Catcher. All rights reserved.</p>
          <div className="mt-4 flex gap-4 md:mt-0">
            <Link href="/" className="text-slate-400 transition-colors hover:text-white">
              Home
            </Link>
            <Link href="/features" className="text-slate-400 transition-colors hover:text-white">
              Feature Overview
            </Link>
            <a href={supportLink} className="text-slate-400 transition-colors hover:text-white">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
