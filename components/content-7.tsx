import { Cpu, Zap } from 'lucide-react'
import Image from 'next/image'

export default function ContentSection() {
    return (
        <section className="py-30 md:py-32">
            <div className="mx-auto max-w-5xl space-y-8 px-5 mt-5 md:space-y-16">
                <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl"> Download the App and get lower subscribtion rates</h2>
                <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
                    <div className="relative space-y-4">
                        <p className="text-muted-foreground">
                            Catcher is the first global, platform-agnostic, real-time theft prevention and recovery ecosystem — compatible with all devices and assets.
                        </p>
                        <p className="text-muted-foreground">Community-Powered Alerts
                            Users can activate “missing item alerts” visible to a global network. This turns every user into a node in a recovery network.</p>

                        <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Zap className="size-4" />
                                    <h3 className="text-sm font-medium">Faaast</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">It supports an entire helping developers and innovate.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Cpu className="size-4" />
                                    <h3 className="text-sm font-medium">Powerful</h3>
                                </div>
                                <p className="text-muted-foreground text-sm">It supports an entire helping developers and businesses.</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative mt-1 sm:mt-0">
                        <div className="bg-linear-to-b aspect-67/34 relative rounded-2xl from-zinc-100 to-transparent p-px dark:from-zinc-300">
                            <Image src="/features-1.png" className="hidden rounded-[15px] dark:block" alt="payments illustration dark" width={1206} height={612} />
                            <Image src="/features-1.png" className="rounded-[15px] shadow dark:hidden" alt="payments illustration light" width={1206} height={612} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
