import type { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import Footer from "@/components/footer";
import { LegalIndexContent } from "@/components/legal-index-content";

export const metadata: Metadata = {
  title: "Legal Centre | Catcher",
  description:
    "Catcher terms of service, privacy policy, acceptable use, stolen reporting, billing and cookie policies in one place.",
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Navigation />
      <main>
        <LegalIndexContent />
      </main>
      <Footer />
    </div>
  );
}
