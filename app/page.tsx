import { Navigation } from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import { FranchiseSection } from "@/components/franchise-section";
import { StatsCounter } from "@/components/stats-counter";
import { FeaturesSection } from "@/components/features-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import Features from "@/components/features-1";
import { PricingSection } from "@/components/pricing-section";
import { CTASection } from "@/components/cta-section";
import Footer from "@/components/footer";
import ContentSection from "@/components/content-5";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Navigation />

      {/* Main Content */}
      <main>
        <HeroSection />
        <FranchiseSection />
        <StatsCounter />
        <FeaturesSection />
        <ContentSection />
        <TestimonialsSection />
        <Features />
        <PricingSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
