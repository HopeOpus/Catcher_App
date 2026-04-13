"use client";

import { useEffect, useState } from "react";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";

const stats = [
  { label: "Total Users", value: 800, suffix: "" },
  { label: "Stolen Properties Reclaimed", value: 1300, suffix: "" },
  { label: "Countries Reached", value: 4, suffix: "" },
  { label: "Years", value: 5, suffix: " Years" },
];

export function StatsCounter() {
  const [counts, setCounts] = useState(() => stats.map(() => 0));

  useEffect(() => {
    let frame = 0;
    const duration = 1800;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setCounts(
        stats.map((stat) => Math.round(stat.value * progress))
      );

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="bg-[#f8fbff] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-base font-semibold uppercase tracking-[0.3em] text-[#36689e]">
            Catcher by the numbers
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Trusted by users around the world.
          </h2>
        </div>

        <AnimatedGroup>
          <div className="flex flex-col md:flex-row justify-center gap-6 flex-wrap md:flex-nowrap">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="flex-1 min-w-full md:min-w-0 rounded-3xl border border-slate-200/70 bg-white p-8 text-center shadow-sm shadow-slate-900/5"
              >
                <p className="text-5xl font-semibold tracking-tight text-[#0F2651]">
                  {counts[index]}
                  {stat.suffix}
                </p>
                <p className="mt-4 text-base font-medium text-slate-600">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </AnimatedGroup>
      </div>
    </section>
  );
}
