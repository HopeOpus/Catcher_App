import Image from 'next/image'
import { Camera, FileText, LayoutDashboard, Shield } from 'lucide-react'

export default function ContentSection() {
    return (
        <section
            id="how-it-works"
            className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-12">
                <div className="mx-auto max-w-xl space-y-6 text-center md:space-y-12">
                    <h2 className="text-balance text-4xl font-medium lg:text-5xl">
                        One place to manage the records behind your{' '}
                        <span className="text-[#36689e]">most important items</span>
                    </h2>
                    <p className="text-lg text-slate-600">
                        Build a clean property profile once, then use it across your
                        dashboard whenever you need to review ownership details, check item
                        status, or report a loss.
                    </p>
                </div>
                <Image
                    className="rounded-(--radius) h-auto w-full"
                    src="/app image.svg"
                    alt="Catcher app preview"
                    width={1200}
                    height={720}
                />

                <div className="relative mx-auto grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-8 lg:grid-cols-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <FileText className="size-4" />
                            <h3 className="text-sm font-medium">Clear details</h3>
                        </div>
                        <p className="text-sm text-slate-600">
                            Save the identifying information that helps you recognise and
                            verify each item later.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Camera className="size-4" />
                            <h3 className="text-sm font-medium">Photo evidence</h3>
                        </div>
                        <p className="text-sm text-slate-600">
                            Attach images so your records stay visual, easier to review, and
                            more useful during recovery.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Shield className="size-4" />
                            <h3 className="text-sm font-medium">Status visibility</h3>
                        </div>
                        <p className="text-sm text-slate-600">
                            See whether an item is active or reported stolen without keeping
                            separate spreadsheets or notes.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <LayoutDashboard className="size-4" />
                            <h3 className="text-sm font-medium">Dashboard ready</h3>
                        </div>
                        <p className="text-sm text-slate-600">
                            Keep personal and business assets in one organized dashboard with
                            less friction.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
