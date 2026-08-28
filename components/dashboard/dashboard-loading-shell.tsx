function PulseBlock({
  className,
}: {
  className: string;
}) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`} />;
}

export default function DashboardLoadingShell() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <PulseBlock className="h-3 w-32" />
          <PulseBlock className="h-10 w-72 max-w-full" />
          <PulseBlock className="h-4 w-[32rem] max-w-full" />
          <PulseBlock className="h-4 w-[24rem] max-w-full" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <PulseBlock className="h-11 w-40" />
          <PulseBlock className="h-11 w-48" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`stat-${index + 1}`}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <PulseBlock className="h-4 w-28" />
            <PulseBlock className="mt-4 h-9 w-20" />
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <PulseBlock className="h-5 w-44" />
        <PulseBlock className="mt-3 h-4 w-full" />
        <PulseBlock className="mt-2 h-4 w-5/6" />
        <PulseBlock className="mt-5 h-11 w-44" />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <PulseBlock className="h-5 w-40" />
          <PulseBlock className="h-4 w-56" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`row-${index + 1}`}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <PulseBlock className="h-5 w-40" />
              <PulseBlock className="mt-3 h-4 w-56" />
              <PulseBlock className="mt-2 h-4 w-32" />
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={`side-${index + 1}`}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <PulseBlock className="h-5 w-36" />
              <PulseBlock className="mt-3 h-4 w-52" />
              <PulseBlock className="mt-5 h-20 w-full" />
              <PulseBlock className="mt-4 h-11 w-40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
