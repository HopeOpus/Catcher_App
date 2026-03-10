import { Button } from "@/components/ui/button";

export function PricingSection() {
  const plans = [
    {
      name: "Free",
      price: "$1",
      period: "monthly",
      description: "Perfect for individuals, Monthly Payments",
      features: [
        "Up to 3 projects",
        "Basic task management",
        "File sharing (500MB)",
        "Email support",
        "Mobile app access"
      ],
      cta: "Get Started",
      popular: true
    },
    {
      name: "Pro",
      price: "$15",
      period: "per user/month",
      description: "For growing teams and professionals",
      features: [
        "Unlimited projects",
        "Advanced task management",
        "File sharing (5GB)",
        "Priority email support",
        "Mobile app access",
        "Custom workflows",
        "Advanced analytics",
        "Team collaboration"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Enterprise",
      price: "$30",
      period: "per user/month",
      description: "For large organizations with advanced needs",
      features: [
        "Everything in Pro",
        "Unlimited file storage",
        "24/7 phone & email support",
        "Custom integrations",
        "Advanced security features",
        "Dedicated account manager",
        "SSO & SAML",
        "Custom SLA"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F2651] mb-4">
            Simple, Transparent
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#336699] to-[#0F2651]">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Choose the plan that fits your needs. All plans include a 14-day free trial. 
            No credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-gradient-to-br from-white to-slate-50 p-8 rounded-2xl shadow-lg border-2 ${
                plan.popular 
                  ? "border-[#36689e]/50 bg-gradient-to-br from-[#f0f5fa] to-white" 
                  : "border-slate-200/50"
              } hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-[#336699] to-[#0F2651] text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-600 ml-2">/{plan.period}</span>
                </div>
                <p className="text-slate-600 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className={`w-full py-3 text-lg font-semibold border-radius-2xl ${
                  plan.popular
                    ? "bg-gradient-to-r from-[#336699] to-[#0F2651] hover:from-[#0F2651] hover:to-[#0F2651] text-white shadow-lg border-radius-2xl border-[#36689e]"
                    : "bg-white text-[#0F2651] border-radius-2xl border-slate-300 hover:bg-slate-100"
                } transition-all duration-200 transform hover:-translate-y-1`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-600">
            Looking for custom solutions?{" "}
            <a href="#" className="text-[#36689e] hover:text-[#0F2651] font-medium">
              Contact our sales team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
