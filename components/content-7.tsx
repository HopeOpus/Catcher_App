import Image from 'next/image'
import { Cpu, Zap } from 'lucide-react'

export default function ContentSection() {
    return (
        <section className="py-20 md:py-28">
            <div className="mx-auto mt-5 max-w-5xl space-y-8 px-5 md:space-y-16">
                <h2 className="relative z-10 max-w-2xl text-4xl font-medium lg:text-5xl">
                    A cleaner system for documenting, checking, and reporting property
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
                    <div className="relative space-y-4">
                        <p className="text-slate-600">
                            Catcher keeps the core workflow simple: register an item well
                            once, review it from your dashboard later, and use that record
                            when an item needs to be checked or reported.
                        </p>
                        <p className="text-slate-600">
                            That makes it easier to move from scattered ownership notes to a
                            more professional record that supports both day-to-day tracking
                            and incident response.
                        </p>

                        <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Zap className="size-4" />
                                    <h3 className="text-sm font-medium">Fast registration</h3>
                                </div>
                                <p className="text-sm text-slate-600">
                                    Add the important details without turning setup into a long
                                    admin task.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Cpu className="size-4" />
                                    <h3 className="text-sm font-medium">Flexible coverage</h3>
                                </div>
                                <p className="text-sm text-slate-600">
                                    Works for personal valuables, business equipment, and other
                                    items that need stronger visibility.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="relative mt-1 sm:mt-0">
                        <div className="bg-linear-to-b aspect-67/34 relative rounded-2xl from-zinc-100 to-transparent p-px dark:from-zinc-300">
                            <Image
                                src="/features-1.png"
                                className="hidden rounded-[15px] dark:block"
                                alt="Catcher features preview"
                                width={1206}
                                height={612}
                            />
                            <Image
                                src="/features-1.png"
                                className="rounded-[15px] shadow dark:hidden"
                                alt="Catcher features preview"
                                width={1206}
                                height={612}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
