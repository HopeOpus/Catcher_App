export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Product Manager",
      company: "TechCorp Inc.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      quote: "Catcher has completely transformed how our team collaborates. We've seen a 40% increase in productivity and our project delivery times have improved dramatically.",
      rating: 5
    },
    {
      name: "Marcus Chen",
      role: "CTO",
      company: "StartupXYZ",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      quote: "The analytics and reporting features are incredible. We can now make data-driven decisions about our development process and resource allocation.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Team Lead",
      company: "DesignStudio",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      quote: "Our clients love the transparency Catcher provides. They can see project progress in real-time, which has significantly improved our client relationships.",
      rating: 5
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Loved by Teams
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Worldwide
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Join thousands of teams who have transformed their workflow with Catcher. 
            Here`s what they have to say about their experience.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">{testimonial.name}</h4>
                  <p className="text-slate-600">{testimonial.role} at {testimonial.company}</p>
                </div>
              </div>
              
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.787 1.402 8.17L12 18.896l-7.336 3.881 1.4-8.17L.13 9.211l8.2-1.193z"/>
                  </svg>
                ))}
              </div>

              <blockquote className="text-slate-700 leading-relaxed italic">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-slate-900 mb-2">4.9/5</div>
            <div className="text-slate-600">Average Rating</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-slate-900 mb-2">50K+</div>
            <div className="text-slate-600">Active Users</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-slate-900 mb-2">98%</div>
            <div className="text-slate-600">Customer Satisfaction</div>
          </div>
        </div>
      </div>
    </section>
  );
}