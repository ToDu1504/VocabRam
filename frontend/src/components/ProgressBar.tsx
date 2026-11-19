export function ProgressBar({ value, total, className = "" }: { value: number; total: number; className?: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-line ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
    >
      <div className={`h-full rounded-full ${pct === 100 ? "bg-success" : "bg-accent"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
