import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navigation } from "@/components/navigation";
import Footer from "@/components/footer";
import { LegalDocumentView } from "@/components/legal-document-view";
import { getLegalDocument, getLegalDocumentSlugs } from "@/lib/legal";

type LegalDocumentPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getLegalDocumentSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: LegalDocumentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = getLegalDocument(slug);

  if (!document) {
    return {
      title: "Legal Centre | Catcher",
    };
  }

  return {
    title: `${document.title} | Catcher`,
    description: document.summary,
  };
}

export default async function LegalDocumentPage({
  params,
}: LegalDocumentPageProps) {
  const { slug } = await params;
  const document = getLegalDocument(slug);

  if (!document) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Navigation />
      <main>
        <LegalDocumentView document={document} />
      </main>
      <Footer />
    </div>
  );
}
