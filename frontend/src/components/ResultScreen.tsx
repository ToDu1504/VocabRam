import type { ReactNode } from "react";

export function ResultScreen({ title, stats, children }: { title: string; stats: [string, number | string][]; children?: ReactNode }) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-2xl border border-line bg-panel p-8 text-center">
      <span className="text-6xl" aria-hidden="true">
        🎉
      </span>
      <h2 className="text-2xl font-bold">{title}</h2>
      <dl className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-bg/60 p-3">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-2xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex w-full flex-wrap justify-center gap-3">{children}</div>
    </section>
  );
}
