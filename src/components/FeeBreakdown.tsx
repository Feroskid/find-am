import { computeFees, formatNaira } from "@/lib/fees";

export function FeeBreakdown({ budget }: { budget: number }) {
  const f = computeFees(budget);
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
      <div className="font-semibold mb-2">Payment summary</div>
      <Row label="Task budget" value={formatNaira(f.budget)} />
      <Row label="Service fee (10%)" value={formatNaira(f.serviceFee)} />
      <Row label="Fixed fee" value={formatNaira(f.fixedFee)} />
      <Row label="VAT (7.5% of service fee)" value={formatNaira(f.vat)} />
      <div className="my-2 h-px bg-border" />
      <Row label="You pay" value={formatNaira(f.total)} bold />
      <Row label="Tasker receives" value={formatNaira(f.taskerReceives)} muted />
      <p className="mt-3 text-xs text-muted-foreground">
        Held securely until task is completed.
      </p>
    </div>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between py-0.5 ${bold ? "font-bold text-foreground" : muted ? "text-muted-foreground" : "text-foreground/80"}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
