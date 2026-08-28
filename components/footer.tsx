import Link from 'next/link'
import Image from 'next/image'
import { SUPPORT_EMAIL, buildSupportMailto } from '@/lib/support'
import { LEGAL_DOCUMENTS, buildLegalDocumentPath } from '@/lib/legal'

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
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
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
              search the public registry before purchase.
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
                <Link href="/search-registry" className="transition-colors hover:text-white">
                  Search Registry
                </Link>
              </li>
              <li>
                <Link href="/catcher-security-credit" className="transition-colors hover:text-white">
                  Wallet/Referral
                </Link>
              </li>
              <li>
                <Link href="/#catcher-global-franchise" className="transition-colors hover:text-white">
                  Franchise
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
          <div>
            <h3 className="mb-4 text-lg font-semibold">Legal</h3>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/legal" className="transition-colors hover:text-white">
                  Legal Centre
                </Link>
              </li>
              {LEGAL_DOCUMENTS.map((document) => (
                <li key={document.slug}>
                  <Link
                    href={buildLegalDocumentPath(document.slug)}
                    className="transition-colors hover:text-white">
                    {document.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between border-t border-slate-800 pt-8 md:flex-row">
          <p className="text-slate-400">© {currentYear} Catcher. All rights reserved.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 md:mt-0 md:justify-end">
            <Link href="/" className="text-slate-400 transition-colors hover:text-white">
              Home
            </Link>
            <Link href="/features" className="text-slate-400 transition-colors hover:text-white">
              Feature Overview
            </Link>
            <Link href="/legal/terms" className="text-slate-400 transition-colors hover:text-white">
              Terms
            </Link>
            <Link href="/legal/privacy" className="text-slate-400 transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="/legal/cookies" className="text-slate-400 transition-colors hover:text-white">
              Cookies
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
