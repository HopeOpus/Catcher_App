import { Building2, Search, Shield, User } from 'lucide-react'

export default function CommunitySection() {
    const audiences = [
        {
            title: 'Individual owners',
            description:
                'Keep a reliable record of personal valuables, gadgets, tools, and high-value items in one place.',
            icon: User,
        },
        {
            title: 'Buyers and resellers',
            description:
                'Check reported items before purchase so you can reduce avoidable risk in second-hand transactions.',
            icon: Search,
        },
        {
            title: 'Families and shared households',
            description:
                'Bring scattered ownership details into a cleaner system instead of relying on memory alone.',
            icon: Shield,
        },
        {
            title: 'Businesses and teams',
            description:
                'Track equipment and other assets with clearer visibility across the people responsible for them.',
            icon: Building2,
        },
    ]

    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="text-center">
                    <h2 className="text-3xl font-semibold">
                        Built for the people who need clearer property records
                    </h2>
                    <p className="mt-6 text-slate-600">
                        Catcher is flexible enough for everyday owners and structured enough
                        for teams managing many assets.
                    </p>
                </div>
                <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2">
                    {audiences.map((audience) => (
                        <div
                            key={audience.title}
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 inline-flex rounded-xl bg-[#36689e]/10 p-3 text-[#0F2651]">
                                <audience.icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#0F2651]">
                                {audience.title}
                            </h3>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                {audience.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
