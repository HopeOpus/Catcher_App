import Image from "next/image";

export function FranchiseSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0b1c3f_0%,#12386d_45%,#1b4f8f_100%)] py-20 text-white sm:py-24">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(120,186,255,0.18),transparent_28%)]"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-white/10 lg:block"
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
        <div className="space-y-7">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-blue-100">
            Global Expansion
          </div>

          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-blue-200 sm:text-base">
              Catcher Global Franchise
            </p>
            <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Building the World&apos;s First Universal Digital Registry for Valuable
              Items
            </h2>
            <p className="max-w-2xl text-base leading-8 text-blue-50/90 sm:text-lg">
              Catcher is expanding a trusted registration and verification system built to
              serve owners, buyers, and communities across borders.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/15 bg-white/8 p-6 backdrop-blur-sm sm:p-7">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-blue-200">
              For more information
            </p>
            <a
              href="mailto:franchise@catchersecurities.com"
              className="mt-3 inline-flex max-w-full break-all text-lg font-semibold text-white underline decoration-white/40 underline-offset-4 transition hover:decoration-white sm:break-normal"
            >
              franchise@catchersecurities.com
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-6 top-8 hidden h-24 w-24 rounded-full bg-cyan-300/20 blur-3xl sm:block" />
          <div className="absolute -bottom-10 right-0 h-28 w-28 rounded-full bg-blue-200/20 blur-3xl" />

          <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/10 p-5 shadow-[0_30px_80px_rgba(7,15,37,0.35)] backdrop-blur-md sm:p-7">
            <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04))]" />

            <div className="relative space-y-5">
              <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">
                  Universal Registry
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">
                  Ownership Proof
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">
                  Franchise Ready
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[26px] border border-white/15 bg-[#0d244d]/70 p-5">
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-blue-200">
                    Vision
                  </p>
                  <p className="mt-4 text-xl font-semibold leading-8 text-white">
                    One trusted verification network for valuable items, anywhere in the
                    world.
                  </p>
                </div>

                <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-white/10 p-4">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(117,205,255,0.24),transparent_60%)]" />
                  <div className="relative mx-auto aspect-square max-w-[240px]">
                    <Image
                      src="/globe.svg"
                      alt="Global registry visual"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-blue-200">
                    Reach
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">Cross-border</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-blue-200">
                    Model
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">Franchise-led</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-blue-200">
                    Focus
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">Verified ownership</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
