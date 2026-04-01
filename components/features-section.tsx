import Link from 'next/link'
import { Bell, Building2, Camera, LayoutDashboard, Search, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FeaturesSection() {
  const features = [
    {
      title: 'Structured property registration',
      description:
        'Capture names, serial numbers, descriptions, and supporting details in a clean record you can return to anytime.',
      icon: LayoutDashboard,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Photo-backed records',
      description:
        'Add images to each property so your dashboard stays visual, easier to verify, and more useful during recovery.',
      icon: Camera,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Stolen item checks',
      description:
        'Search reported items before you buy second-hand goods and reduce the risk of purchasing stolen property.',
      icon: Search,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Fast stolen reporting',
      description:
        'When something goes missing, move from documentation to a real stolen report without rebuilding the record from scratch.',
      icon: Bell,
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Clear ownership history',
      description:
        'Keep one place for the details that help prove what is yours, instead of scattered chats, screenshots, and notes.',
      icon: Shield,
      color: 'from-indigo-500 to-blue-500',
    },
    {
      title: 'Ready for people and businesses',
      description:
        'Catcher works for personal valuables, office equipment, store inventory, and other assets that need better visibility.',
      icon: Building2,
      color: 'from-teal-500 to-blue-500',
    },
  ]

  return (
    <section id="features" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-[#0F2651] md:text-5xl">
            A practical workflow for
            <span className="block bg-gradient-to-r from-[#336699] to-[#0F2651] bg-clip-text text-transparent">
              protecting valuable property
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-slate-600">
            Catcher is built around the real moments that matter: documenting what
            you own, checking suspicious items before purchase, and responding
            quickly if an item is stolen.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div
                className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${feature.color} text-white shadow-lg`}>
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-[#0F2651] transition-colors group-hover:text-[#36689e]">
                {feature.title}
              </h3>
              <p className="leading-relaxed text-slate-600">{feature.description}</p>
              <div className="mt-6 flex items-center gap-2 font-medium text-[#36689e]">
                <span>Learn more</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button
            asChild
            className="transform rounded-xl bg-gradient-to-r from-[#336699] to-[#0F2651] px-8 py-4 text-lg text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:from-[#0F2651] hover:to-[#0F2651] hover:shadow-xl">
            <Link href="/features">Explore the Feature Overview</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
