import type { ReactNode } from "react";

export default function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#36689e]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl font-bold text-[#0F2651]">{title}</h1>
        <p className="mt-2 max-w-3xl text-gray-600">{description}</p>
      </div>
      {actions ? <div className="flex flex-col gap-3 sm:flex-row">{actions}</div> : null}
    </div>
  );
}
