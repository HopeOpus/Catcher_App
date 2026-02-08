import { Button } from "@/components/ui/button";

export function FeaturesSection() {
  const features = [
    {
      title: "Smart Project Management",
      description: "Organize your projects with intuitive boards, task lists, and progress tracking. Keep everything in one place and never lose track of important work.",
      icon: "📋",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Real-time Collaboration",
      description: "Work together seamlessly with your team. Share files, leave comments, and get instant updates on project changes.",
      icon: "👥",
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Advanced Analytics",
      description: "Gain insights into your team's performance with detailed analytics and customizable reports. Make data-driven decisions.",
      icon: "📊",
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Smart Automation",
      description: "Automate repetitive tasks and workflows to save time and reduce errors. Focus on what matters most.",
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
      title: "Mobile Ready",
      description: "Access your projects from anywhere with our responsive design. Work on the go with our mobile-optimized interface.",
      icon: "📱",
      color: "from-teal-500 to-blue-500"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Everything You Need to
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Succeed
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Powerful features designed to help your team work smarter, faster, and more efficiently. 
            Everything you need to take your projects to the next level.
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
              <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
              <div className="mt-6 flex items-center gap-2 text-blue-600 font-medium">
                <span>Learn more</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            Explore All Features
          </Button>
        </div>
      </div>
    </section>
  );
}
