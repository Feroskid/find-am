import { Lock } from "lucide-react";

interface Props {
  earnings?: number; // current period earnings in NGN
  currency?: string;
}

const TIERS = [
  { name: "Bronze", fee: "20%", min: 0 },
  { name: "Silver", fee: "18.5%", min: 880_000 },
  { name: "Gold", fee: "17%", min: 2_650_000 },
  { name: "Platinum", fee: "15%", min: 5_300_000 },
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
            <span className="font-display text-3xl text-ink">{cur.name}</span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{cur.fee} service fee</span>
          </div>
        </div>
        {next && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Your next tier</div>
            <div className="mt-1 flex items-center gap-3">
              <span className="font-display text-3xl text-ink/80 inline-flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" /> {next.name}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{next.fee} service fee</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="text-sm font-semibold text-ink">Your earnings (last 30 days)</div>
        {next && (
          <p className="text-sm text-muted-foreground mt-0.5">
            Your earnings are <span className="font-semibold text-foreground">{currency}{away.toLocaleString()}</span> away from <span className="font-semibold text-foreground">{next.name}</span> and lowering service fees.
          </p>
        )}

        <div className="mt-4 relative">
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 grid grid-cols-4 text-[10px] text-muted-foreground">
            {TIERS.map((t) => (
              <div key={t.name} className="text-left first:text-left last:text-right">
                <div className="font-semibold text-foreground">{currency}{t.min.toLocaleString()}</div>
                <div>{t.name}</div>
              </div>
            ))}
          </div>
        </div>

        <button className="mt-5 text-xs font-semibold text-primary hover:underline">? How do tiers work?</button>
      </div>
    </section>
  );
}
