import { Lock } from "lucide-react";

interface Props {
  earnings?: number; // current month earnings in NGN
  currency?: string;
}

const TIERS = [
  { name: "Bronze", min: 0, color: "#CD7F32" },
  { name: "Silver", min: 400_000, color: "#9CA3AF" },
  { name: "Gold", min: 1_000_000, color: "#D4AF37" },
  { name: "Platinum", min: 1_800_000, color: "#6366F1" },
];

export function TierProgress({ earnings = 0, currency = "₦" }: Props) {
  const cur = [...TIERS].reverse().find((t) => earnings >= t.min) ?? TIERS[0];
  const curIdx = TIERS.findIndex((t) => t.name === cur.name);
  const next = TIERS[curIdx + 1];

  const max = TIERS[TIERS.length - 1].min;
  const pct = Math.min(100, (earnings / max) * 100);
  const away = next ? Math.max(0, next.min - earnings) : 0;

  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-7">
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Your current tier</div>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-display text-3xl" style={{ color: cur.color }}>{cur.name}</span>
          </div>
        </div>
        {next && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Next tier</div>
            <div className="mt-1 flex items-center gap-3">
              <span className="font-display text-3xl text-ink/70 inline-flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" /> {next.name}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="text-sm font-semibold text-ink">Your earnings (last 30 days)</div>
        <div className="mt-0.5 font-display text-2xl text-ink">{currency}{earnings.toLocaleString()}</div>
        {next ? (
          <p className="text-sm text-muted-foreground mt-1">
            You're <span className="font-semibold text-foreground">{currency}{away.toLocaleString()}</span> away from <span className="font-semibold" style={{ color: next.color }}>{next.name}</span>.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">
            You've reached the top tier this month. Nice work. 🎉
          </p>
        )}

        <div className="mt-4 relative">
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(to right, ${cur.color}, ${cur.color}99)` }} />
          </div>
          <div className="mt-2 grid grid-cols-4 text-[10px] text-muted-foreground">
            {TIERS.map((t) => (
              <div key={t.name} className="text-left first:text-left last:text-right">
                <div className="font-semibold" style={{ color: t.color }}>{currency}{t.min.toLocaleString()}</div>
                <div>{t.name}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">Resets after 30days.</p>
      </div>
    </section>
  );
}
