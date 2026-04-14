import { Navigation } from "@/components/navigation";
import Footer from "@/components/footer";
import { CatcherSecurityCreditContent } from "@/components/catcher-security-credit-content";

export const metadata = {
  title: "Catcher Security Credit | Rewards & Wallet",
  description: "Earn coins through referrals, protect your family, and manage your Catcher Wallet.",
};

export default function CatcherSecurityCreditPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Navigation />
      <main>
        <CatcherSecurityCreditContent />
      </main>
      <Footer />
    </div>
  );
}
