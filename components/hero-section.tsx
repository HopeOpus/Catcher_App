import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SignedIn, SignedOut } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { TextEffect } from '@/components/motion-primitives/text-effect'
import { AnimatedGroup } from '@/components/motion-primitives/animated-group'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring',
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export default function HeroSection() {
    return (
        <section
            id="top"
            className="overflow-hidden">
            <div
                aria-hidden
                className="absolute inset-0 isolate hidden contain-strict lg:block">
                <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
                <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
                <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
            </div>

            <div className="relative pt-24">
                <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]" />
                <div className="mx-auto max-w-5xl px-6">
                    <div className="sm:mx-auto lg:mr-auto lg:mt-0">
                        <TextEffect
                            preset="fade-in-blur"
                            speedSegment={0.3}
                            as="h1"
                            className="mt-8 max-w-3xl text-balance text-5xl font-bold tracking-tight text-[#0F2651] md:text-6xl lg:mt-16">
                            Protect what you own.{' '}
                            <span className="text-[#36689e]">Prove what is yours.</span>
                        </TextEffect>

                        <TextEffect
                            per="line"
                            preset="fade-in-blur"
                            speedSegment={0.3}
                            delay={0.5}
                            as="p"
                            className="mt-8 max-w-2xl text-pretty text-lg text-slate-700">
                            Catcher helps you register valuables with photos and serial
                            numbers, keep a clean ownership record, and respond quickly if
                            something goes missing. Buyers can also search the registry
                            before purchase to check ownership details and theft status.
                        </TextEffect>

                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.75,
                                        },
                                    },
                                },
                                ...transitionVariants,
                            }}
                            className="mt-12 flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:gap-8">
                            <SignedOut>
                                <Button
                                    asChild
                                    size="lg"
                                    className="rounded-xl bg-gradient-to-r from-[#336699] to-[#0F2651] px-5 text-base text-white">
                                    <Link href="/auth/signup">
                                        <span className="text-nowrap">Create a Free Account</span>
                                    </Link>
                                </Button>
                            </SignedOut>
                            <SignedIn>
                                <Button
                                    asChild
                                    size="lg"
                                    className="rounded-xl bg-gradient-to-r from-[#336699] to-[#0F2651] px-5 text-base text-white">
                                    <Link href="/dashboard">
                                        <span className="text-nowrap">Go to Dashboard</span>
                                    </Link>
                                </Button>
                            </SignedIn>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="rounded-xl border-[#36689e] px-5 text-base text-[#0F2651] hover:bg-[#36689e]/10">
                                <Link href="/search-registry">
                                    <span className="text-nowrap">Search Registry</span>
                                </Link>
                            </Button>
                        </AnimatedGroup>
                    </div>
                </div>

                <AnimatedGroup
                    variants={{
                        container: {
                            visible: {
                                transition: {
                                    staggerChildren: 0.05,
                                    delayChildren: 0.75,
                                },
                            },
                        },
                        ...transitionVariants,
                    }}>
                    <div className="mask-b-from-55% relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                        <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-5xl overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1">
                            <Image
                                className="bg-background aspect-15/8 relative hidden rounded-2xl dark:block"
                                src="/hero_img.svg"
                                alt="Catcher dashboard preview"
                                width={2700}
                                height={1440}
                                style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                            />
                            <Image
                                className="z-2 border-border/25 aspect-15/8 relative rounded-2xl border dark:hidden"
                                src="/hero_img.svg"
                                alt="Catcher dashboard preview"
                                width={2700}
                                height={1440}
                                style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                            />
                        </div>
                    </div>
                </AnimatedGroup>
            </div>
        </section>
    )
}
