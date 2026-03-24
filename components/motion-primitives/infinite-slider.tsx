"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type InfiniteSliderProps = {
  children: React.ReactNode;
  className?: string;
  gap?: number;
  speed?: number;
  speedOnHover?: number;
};

export function InfiniteSlider({
  children,
  className,
  gap = 64,
  speed = 40,
  speedOnHover = 20,
}: InfiniteSliderProps) {
  const items = React.Children.toArray(children);
  const baseDuration = Math.max(12, (items.length * 8_000) / Math.max(speed, 1));
  const hoverDuration = Math.max(
    12,
    (items.length * 8_000) / Math.max(speedOnHover, 1),
  );

  return (
    <div className={cn("group overflow-hidden", className)}>
      <div
        className="infinite-slider-track flex min-w-max items-center"
        style={
          {
            "--slider-gap": `${gap}px`,
            "--slider-duration": `${baseDuration}ms`,
            "--slider-hover-duration": `${hoverDuration}ms`,
          } as React.CSSProperties
        }
      >
        {[0, 1].map((copyIndex) =>
          items.map((child, index) => (
            <div
              key={`${copyIndex}-${index}`}
              className="shrink-0"
              style={{ marginRight: `${gap}px` }}
            >
              {child}
            </div>
          )),
        )}
      </div>

      <style jsx>{`
        .infinite-slider-track {
          animation: infinite-slider-scroll var(--slider-duration) linear infinite;
        }

        .group:hover .infinite-slider-track {
          animation-duration: var(--slider-hover-duration);
        }

        @keyframes infinite-slider-scroll {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(calc(-50% - (var(--slider-gap) / 2)));
          }
        }
      `}</style>
    </div>
  );
}
