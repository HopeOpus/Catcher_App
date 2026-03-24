import ContentSection from "@/components/content-7";
import CommunitySection from "@/components/content-6";
import Footer from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { CTASection } from "@/components/cta-section";

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <Navigation />
            <main>
                <ContentSection />
                <CommunitySection />
                <CTASection />
            </main>
            <Footer />
        </div>
    );
}
