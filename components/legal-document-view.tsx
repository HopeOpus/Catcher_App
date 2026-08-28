import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  Info,
  ListTree,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LEGAL_DOCUMENTS, buildLegalDocumentPath } from "@/lib/legal";
import { LEGAL_ENTITY } from "@/lib/legal/entity";
import type { LegalBlock, LegalCalloutTone, LegalDocument } from "@/lib/legal/types";

const CALLOUT_STYLES: Record<
  LegalCalloutTone,
  { wrapper: string; icon: string; title: string; body: string }
> = {
  info: {
    wrapper: "border-[#36689e]/30 bg-[#f0f5fa]",
    icon: "text-[#36689e]",
    title: "text-[#0F2651]",
    body: "text-slate-700",
  },
  warning: {
    wrapper: "border-amber-300 bg-amber-50",
    icon: "text-amber-600",
    title: "text-amber-900",
    body: "text-amber-900/90",
  },
  critical: {
    wrapper: "border-red-300 bg-red-50",
    icon: "text-red-600",
    title: "text-red-900",
    body: "text-red-900/90",
  },
  positive: {
    wrapper: "border-green-300 bg-green-50",
    icon: "text-green-600",
    title: "text-green-900",
    body: "text-green-900/90",
  },
};

const CALLOUT_ICONS: Record<LegalCalloutTone, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  critical: ShieldAlert,
  positive: CheckCircle2,
};

function LegalBlockView({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "paragraph":
      return <p className="text-[15px] leading-8 text-slate-700">{block.text}</p>;

    case "list":
      return (
        <ul className="space-y-3">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-3 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#36689e]"
              />
              <span className="text-[15px] leading-8 text-slate-700">{item}</span>
            </li>
          ))}
        </ul>
      );

    case "ordered":
      return (
        <ol className="space-y-3">
          {block.items.map((item, index) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#f0f5fa] text-xs font-semibold text-[#0F2651]">
                {index + 1}
              </span>
              <span className="text-[15px] leading-8 text-slate-700">{item}</span>
            </li>
          ))}
        </ol>
      );

    case "definitions":
      return (
        <dl className="space-y-4">
          {block.items.map((item) => (
            <div
              key={item.term}
              className="rounded-2xl border-l-4 border-l-[#36689e] bg-slate-50 px-5 py-4">
              <dt className="text-sm font-semibold uppercase tracking-wide text-[#0F2651]">
                {item.term}
              </dt>
              <dd className="mt-2 text-[15px] leading-8 text-slate-700">{item.text}</dd>
            </div>
          ))}
        </dl>
      );

    case "callout": {
      const styles = CALLOUT_STYLES[block.tone];
      const Icon = CALLOUT_ICONS[block.tone];

      return (
        <div className={`rounded-2xl border-2 px-5 py-5 ${styles.wrapper}`}>
          <div className="flex gap-3">
            <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${styles.icon}`} />
            <div>
              <p className={`text-base font-bold ${styles.title}`}>{block.title}</p>
              <p className={`mt-2 text-[15px] leading-8 ${styles.body}`}>{block.text}</p>
            </div>
          </div>
        </div>
      );
    }

    case "table":
      return (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              {block.caption ? (
                <caption className="border-b border-slate-200 bg-[#f8fbff] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {block.caption}
                </caption>
              ) : null}
              <thead>
                <tr className="bg-[#f0f5fa]">
                  {block.columns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#0F2651]">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr
                    key={row.join("|")}
                    className="border-t border-slate-200 align-top even:bg-slate-50/60">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`${cell}-${cellIndex}`}
                        className={`px-5 py-4 leading-7 ${
                          cellIndex === 0
                            ? "font-medium text-[#0F2651]"
                            : "text-slate-700"
                        }`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    default:
      return null;
  }
}

function TableOfContents({ document }: { document: LegalDocument }) {
  return (
    <nav aria-label="Sections in this document" className="space-y-1">
      {document.sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="block rounded-lg px-3 py-2 text-sm leading-6 text-slate-600 transition-colors hover:bg-[#f0f5fa] hover:text-[#0F2651]">
          {section.heading}
        </a>
      ))}
    </nav>
  );
}

export function LegalDocumentView({ document }: { document: LegalDocument }) {
  const otherDocuments = LEGAL_DOCUMENTS.filter(
    (item) => item.slug !== document.slug,
  );

  return (
    <>
      {/* Document header */}
      <section className="relative overflow-hidden border-b border-slate-200/70 bg-white pb-12 pt-28">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_0%,rgba(54,104,158,0.10)_0%,transparent_70%)]"
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
            <Link href="/" className="transition-colors hover:text-[#0F2651]">
              Home
            </Link>
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
            <Link href="/legal" className="transition-colors hover:text-[#0F2651]">
              Legal
            </Link>
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
            <span className="font-medium text-[#0F2651]">{document.shortTitle}</span>
          </nav>

          <div className="mt-6 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f0f5fa] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#36689e]">
              <FileText aria-hidden="true" className="h-3.5 w-3.5" />
              Catcher legal
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#0F2651] md:text-5xl">
              {document.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{document.intro}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-600">
              <CalendarDays aria-hidden="true" className="h-4 w-4 text-[#36689e]" />
              Effective {document.effectiveDate}
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-600">
              Last updated {document.lastUpdated}
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-600">
              Version {document.version}
            </span>
          </div>
        </div>
      </section>

      {/* Document body */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="xl:sticky xl:top-28 xl:self-start">
              {/* Mobile: collapsible index */}
              <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:hidden">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#0F2651]">
                  <ListTree aria-hidden="true" className="h-4 w-4 text-[#36689e]" />
                  Jump to a section
                </summary>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <TableOfContents document={document} />
                </div>
              </details>

              {/* Desktop: persistent index */}
              <div className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:block">
                <p className="flex items-center gap-2 px-3 pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <ListTree aria-hidden="true" className="h-4 w-4 text-[#36689e]" />
                  On this page
                </p>
                <div className="max-h-[60vh] overflow-y-auto border-t border-slate-100 pt-2">
                  <TableOfContents document={document} />
                </div>
              </div>
            </aside>

            <article className="min-w-0 space-y-4">
              {document.sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                  <h2 className="text-2xl font-bold text-[#0F2651] md:text-[26px]">
                    {section.heading}
                  </h2>
                  <div className="mt-5 space-y-5">
                    {section.blocks.map((block, index) => (
                      <LegalBlockView key={`${section.id}-${index}`} block={block} />
                    ))}
                  </div>
                </section>
              ))}

              {/* Contact card */}
              <div className="rounded-3xl border-2 border-[#36689e]/20 bg-gradient-to-br from-[#f0f5fa] to-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-[#0F2651]">
                  Still have a question?
                </h2>
                <p className="mt-3 max-w-2xl text-[15px] leading-8 text-slate-700">
                  If anything on this page is unclear, or you need help with a record,
                  a report or a payment, our team would rather hear from you than have
                  you guess.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    asChild
                    className="bg-gradient-to-r from-[#336699] to-[#0F2651] text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl">
                    <a href={`mailto:${LEGAL_ENTITY.supportEmail}`}>
                      <Mail aria-hidden="true" className="mr-2 h-4 w-4" />
                      {LEGAL_ENTITY.supportEmail}
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-[#36689e] text-[#0F2651] hover:bg-[#36689e]/10">
                    <Link href="/legal">Back to all documents</Link>
                  </Button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Related documents */}
      <section className="border-t border-slate-200/70 bg-[#f8fbff] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#0F2651]">
            The rest of the agreement
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            These documents work together. Each one assumes you have read the others.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {otherDocuments.map((item) => (
              <Link
                key={item.slug}
                href={buildLegalDocumentPath(item.slug)}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#36689e]/40 hover:shadow-lg">
                <h3 className="text-lg font-semibold text-[#0F2651]">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.summary}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#36689e]">
                  Read it
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
