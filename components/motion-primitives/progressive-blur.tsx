import { cn } from "@/lib/utils";

type ProgressiveBlurProps = {
  className?: string;
  direction?: "left" | "right";
  blurIntensity?: number;
};

export function ProgressiveBlur({
  className,
  direction = "left",
  blurIntensity = 1,
}: ProgressiveBlurProps) {
  const gradient =
    direction === "left"
      ? "linear-gradient(to right, hsl(var(--background)) 15%, transparent 100%)"
      : "linear-gradient(to left, hsl(var(--background)) 15%, transparent 100%)";

  return (
    <div
      aria-hidden
      className={cn(className)}
      style={{
        background: gradient,
        backdropFilter: `blur(${blurIntensity * 14}px)`,
      }}
    />
  );
}
