import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Cookie,
  CreditCard,
  EyeOff,
  FileText,
  Lock,
  Mail,
  Scale,
  ShieldAlert,
  Siren,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LEGAL_DOCUMENTS, buildLegalDocumentPath } from "@/lib/legal";
import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_ENTITY,
  LEGAL_VERSION,
} from "@/lib/legal/entity";

const DOCUMENT_ICONS: Record<string, typeof FileText> = {
  terms: Scale,
  privacy: Lock,
  "acceptable-use": ShieldAlert,
  "stolen-reports": Siren,
  billing: CreditCard,
  cookies: Cookie,
};

const COMMITMENTS = [
  {
    icon: EyeOff,
    title: "Your identity stays off public pages",
    body: "Verification pages show the item, never the owner. Your name, phone number, national identity number and next-of-kin details are never published.",
    href: "/legal/privacy#what-is-public",
    linkLabel: "See exactly what is public",
  },
  {
    icon: BadgeCheck,
    title: "We say plainly what Catcher is not",
    body: "Catcher is documentation and verification. It is not insurance, not law enforcement, and not proof of legal title. Our Terms say so in the third section, not in a footnote.",
    href: "/legal/terms#what-catcher-is",
    linkLabel: "Read the scope of the Service",
  },
  {
    icon: Lock,
    title: "No advertising, no data selling",
    body: "We do not run ads, embed trackers, build behavioural profiles or sell personal data. The cookies we set keep you signed in and keep your session safe.",
    href: "/legal/cookies#overview",
    linkLabel: "Read our cookie approach",
  },
];

const QUICK_ANSWERS = [
  {
    question: "Does registering my property insure it?",
    href: "/legal/terms#what-catcher-is",
  },
  {
    question: "What does a public verification page reveal about me?",
    href: "/legal/privacy#what-is-public",
  },
  {
    question: "What happens when my coverage expires?",
    href: "/legal/billing#coverage-lifecycle",
  },
  {
    question: "Can I get a refund?",
    href: "/legal/billing#refunds",
  },
  {
    question: "An item of mine is listed as stolen and it should not be.",
    href: "/legal/stolen-reports#disputes",
  },
  {
    question: "Do I still need to report a theft to the police?",
    href: "/legal/stolen-reports#police",
  },
  {
    question: "How do I access, correct or delete my data?",
    href: "/legal/privacy#your-rights",
  },
  {
    question: "What are the rules on using owner contact details?",
    href: "/legal/acceptable-use#owner-data",
  },
];

export function LegalIndexContent() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-32">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_0%,rgba(54,104,158,0.12)_0%,transparent_70%)]"
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f0f5fa] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#36689e]">
              <Scale aria-hidden="true" className="h-3.5 w-3.5" />
              Terms, policies and your rights
            </span>
            <h1 className="mt-6 text-5xl font-bold tracking-tight text-[#0F2651] md:text-6xl">
              Catcher{" "}
              <span className="bg-gradient-to-r from-[#336699] to-[#0F2651] bg-clip-text text-transparent">
                Legal Centre
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              A property registry only works if people trust it. These documents set
              out what we promise you, what we ask of you, what we publish, what we
              keep private, and what to do when something goes wrong.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              All documents are at version {LEGAL_VERSION}, effective{" "}
              {LEGAL_EFFECTIVE_DATE}.
            </p>
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold text-[#0F2651] md:text-4xl">
              The documents
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Six documents, each covering one part of the relationship. Together they
              form the full agreement between you and Catcher.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {LEGAL_DOCUMENTS.map((document) => {
              const Icon = DOCUMENT_ICONS[document.slug] ?? FileText;

              return (
                <Link
                  key={document.slug}
                  href={buildLegalDocumentPath(document.slug)}
                  className="group flex flex-col rounded-2xl border-2 border-slate-200/70 bg-gradient-to-br from-white to-slate-50 p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#36689e]/40 hover:shadow-xl">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#336699] to-[#0F2651]">
                    <Icon aria-hidden="true" className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0F2651]">{document.title}</h3>
                  <p className="mt-3 flex-grow text-sm leading-7 text-slate-600">
                    {document.summary}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      {document.sections.length} sections
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-[#36689e]">
                      Read
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="bg-[#f8fbff] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold text-[#0F2651] md:text-4xl">
              Three things worth reading first
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Most people never open a terms page. If you only read three things about
              how Catcher works, make it these.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {COMMITMENTS.map((commitment) => (
              <div
                key={commitment.title}
                className="rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm">
                <commitment.icon
                  aria-hidden="true"
                  className="h-8 w-8 text-[#36689e]"
                />
                <h3 className="mt-5 text-lg font-bold text-[#0F2651]">
                  {commitment.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {commitment.body}
                </p>
                <Link
                  href={commitment.href}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#36689e] transition-colors hover:text-[#0F2651]">
                  {commitment.linkLabel}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick answers */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold text-[#0F2651] md:text-4xl">
              Straight to the answer
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Each link opens the exact clause that answers the question.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {QUICK_ANSWERS.map((item) => (
              <Link
                key={item.question}
                href={item.href}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm transition-all duration-200 hover:border-[#36689e]/40 hover:bg-[#f8fbff]">
                <span className="text-[15px] font-medium leading-7 text-slate-700 group-hover:text-[#0F2651]">
                  {item.question}
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="h-5 w-5 flex-shrink-0 text-[#36689e] transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-[#f8fbff] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border-2 border-[#36689e]/20 bg-gradient-to-br from-[#f0f5fa] to-white p-10 shadow-sm">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
              <div>
                <h2 className="text-3xl font-bold text-[#0F2651]">
                  Talk to a person
                </h2>
                <p className="mt-4 text-[15px] leading-8 text-slate-700">
                  Legal questions, privacy requests, refund enquiries, disputed
                  listings and law enforcement requests all reach the same team. Tell
                  us what you need and we will point you to the right process.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    asChild
                    className="bg-gradient-to-r from-[#336699] to-[#0F2651] text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl">
                    <a href={`mailto:${LEGAL_ENTITY.supportEmail}`}>
                      <Mail aria-hidden="true" className="mr-2 h-4 w-4" />
                      Email the Catcher team
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-[#36689e] text-[#0F2651] hover:bg-[#36689e]/10">
                    <Link href="/#pricing">See plans and pricing</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-600 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Service operated by
                </p>
                <p className="mt-2 font-semibold text-[#0F2651]">
                  {LEGAL_ENTITY.legalName}
                </p>
                <p className="mt-1">{LEGAL_ENTITY.registrationNumber}</p>
                <p className="mt-1">{LEGAL_ENTITY.registeredAddress}</p>
                <p className="mt-3">
                  <a
                    href={`mailto:${LEGAL_ENTITY.supportEmail}`}
                    className="font-medium text-[#36689e] hover:text-[#0F2651]">
                    {LEGAL_ENTITY.supportEmail}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
