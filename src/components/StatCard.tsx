export function Ring({ pct, color }: { pct: number; color: string }) {
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(1, pct)) * circumference;
  return (
    <svg width="76" height="76" viewBox="0 0 60 60" className="flex-none">
      <circle cx="30" cy="30" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="5" />
      <circle
        cx="30"
        cy="30"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        transform="rotate(-90 30 30)"
      />
    </svg>
  );
}

export function StatCard({
  title,
  value,
  sub,
  ring,
}: {
  title: string;
  value: string;
  sub: string;
  ring?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4.5 rounded-[22px] border border-border bg-surface p-5.5">
      {ring}
      <div>
        <div className="text-sm font-bold text-text-muted">{title}</div>
        <div className="mt-0.5 font-display text-2xl tabular-nums">{value}</div>
        <div className="mt-0.5 text-[0.78rem] text-text-muted">{sub}</div>
      </div>
    </div>
  );
}
