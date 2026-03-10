import { Button } from "@/components/ui/button";

export function FeaturesSection() {
  const features = [
    {
      title: "Smart Property Registration",
      description: "Organize your properties with intuitive tools, task lists, and progress tracking. Keep everything in one place and never lose track of important details.",
      icon: "📋",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Report Property stolen anytime",
      description: "Instantly report your property as stolen and help stop thieves from reselling it.",
      icon: "👥",
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Know the properties stolen before purchase",
      description: "Check if a property has been reported stolen before you buy it. Make informed decisions and avoid scams.",
      icon: "📊",
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Smart Integration",
      description: "Seamlessly integrate with your favorite tools and platforms. Our open API allows you to connect with third-party services and customize your workflow.",
      icon: "🤖",
      color: "from-orange-500 to-red-500"
    },
    {
      title: "Secure & Reliable",
      description: "Your data is protected with enterprise-grade security. We ensure 99.9% uptime so you can focus on your work.",
      icon: "🔒",
      color: "from-indigo-500 to-blue-500"
    },
    {
      title: "Mobile Ready with our mobile app",
      description: "Access your properties on the go with our mobile app. Stay connected and manage your properties from anywhere, anytime.",
      icon: "📱",
      color: "from-teal-500 to-blue-500"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F2651] mb-4">
            Security at its Best,  <br />
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#336699] to-[#0F2651]">
              Designed to Help You
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Catcher is built with security in mind, providing you with the tools and features to protect your properties and stay informed. Our platform is designed to help you manage your properties efficiently while ensuring the highest level of security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-gradient-to-br from-white to-slate-50 p-8 rounded-2xl shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl text-white text-2xl mb-6 shadow-lg`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-[#0F2651] mb-4 group-hover:text-[#36689e] transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
              <div className="mt-6 flex items-center gap-2 text-[#36689e] font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button className="bg-gradient-to-r from-[#336699] to-[#0F2651] hover:from-[#0F2651] hover:to-[#0F2651] text-white text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            Explore All Features
          </Button>
        </div>
      </div>
    </section>
  );
}
