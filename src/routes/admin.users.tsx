import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Users, Snowflake, Ban, RotateCcw, Wallet, Download } from "lucide-react";
import { toast } from "sonner";
import {
  adminBanUser, adminFreezeUser, adminReactivateUser, adminViewLedger, adminUserContext,
} from "@/lib/findtask.functions";
import { AdminUserSearch } from "@/components/admin/AdminUserSearch";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function toRows(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.transactions ?? d.entries ?? d.ledger ?? d.results ?? d.items ?? [];
}

function AdminUsersPage() {
  const { token } = useAuth();
  const [userId, setUserId] = useState("");
  const [ledger, setLedger] = useState<any>(null);
  const [ctx, setCtx] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const freezeFn = useServerFn(adminFreezeUser);
  const banFn = useServerFn(adminBanUser);
  const reactFn = useServerFn(adminReactivateUser);
  const ledgerFn = useServerFn(adminViewLedger);
  const ctxFn = useServerFn(adminUserContext);

  const freeze = useMutation({
    mutationFn: () => freezeFn({ data: { userId, reason: reason.trim() || undefined, token: token! } }),
    onSuccess: (r: any) => (r.ok ? (toast.success("Freeze succeeded"), setReason(""), loadContext(userId)) : toast.error(r.error)),
  });
  const ban = useMutation({
    mutationFn: () => banFn({ data: { userId, reason: reason.trim() || undefined, token: token! } }),
    onSuccess: (r: any) => (r.ok ? (toast.success("Ban succeeded"), setReason(""), loadContext(userId)) : toast.error(r.error)),
  });
  const react = useMutation({
    mutationFn: () => reactFn({ data: { userId, token: token! } }),
    onSuccess: (r: any) => (r.ok ? (toast.success("Reactivate succeeded"), loadContext(userId)) : toast.error(r.error)),
  });
  const view = useMutation({
    mutationFn: () =>
      ledgerFn({
        data: {
          userId,
          date_from: from || undefined,
          date_to: to || undefined,
          limit: 500,
          token: token!,
        },
      }),
    onSuccess: (r: any) => (r.ok ? setLedger(r.data) : toast.error(r.error)),
  });
  const context = useMutation({
    mutationFn: (id: string) => ctxFn({ data: { userId: id, token: token! } }),
    onSuccess: (r: any) => (r.ok ? setCtx(r.data) : (setCtx(null), toast.error(r.error))),
  });

  const loadContext = (id: string) => {
    if (id.trim()) context.mutate(id.trim());
  };

  const onPick = (u: any) => {
    const id = String(u.user_id ?? u.id ?? "");
    setUserId(id);
    setLedger(null);
    loadContext(id);
  };

  const needsReason = !reason.trim();
  const disabled = !userId.trim();
  const busy = freeze.isPending || ban.isPending || react.isPending || view.isPending;

  const rows = toRows(ledger);
  const downloadCsv = () => {
    if (!rows.length) return;
    const keys = Array.from(rows.reduce((set: Set<string>, r: any) => { Object.keys(r ?? {}).forEach((k) => set.add(k)); return set; }, new Set<string>()));
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [keys.join(","), ...rows.map((r: any) => keys.map((k) => esc(r?.[k])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${userId}${from ? `-${from}` : ""}${to ? `-${to}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-ink flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> User management</h2>

      <AdminUserSearch onPick={onPick} />

      <div className="rounded-xl border border-border bg-card p-4">
        <label className="text-xs font-semibold text-muted-foreground uppercase">User ID</label>
        <input
          value={userId}
          onChange={(e) => { setUserId(e.target.value); setCtx(null); }}
          onBlur={() => loadContext(userId)}
          placeholder="e.g. HKTLYME7JLV0"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <label className="mt-3 block text-xs font-semibold text-muted-foreground uppercase">Reason (required to freeze or ban — shown in the audit log)</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Repeated off-platform payment requests"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button disabled={disabled || busy || needsReason} onClick={() => freeze.mutate()} className="inline-flex items-center gap-1 rounded-lg bg-sky-600 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
            <Snowflake className="h-3.5 w-3.5" /> Freeze (3 days)
          </button>
          <button disabled={disabled || busy || needsReason} onClick={() => ban.mutate()} className="inline-flex items-center gap-1 rounded-lg bg-destructive text-destructive-foreground px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
            <Ban className="h-3.5 w-3.5" /> Ban
          </button>
          <button disabled={disabled || busy} onClick={() => react.mutate()} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
            <RotateCcw className="h-3.5 w-3.5" /> Reactivate
          </button>
          {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center" />}
        </div>
        {needsReason && <p className="mt-2 text-[11px] text-muted-foreground">Add a reason before freezing or banning — it's recorded against the action.</p>}
      </div>

      {context.isPending && (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading user context…</div>
      )}
      {ctx && <UserContextPanel ctx={ctx} userId={userId} />}

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-ink inline-flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Wallet ledger</h3>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs">
            <span className="block text-muted-foreground uppercase font-semibold">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs">
            <span className="block text-muted-foreground uppercase font-semibold">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm" />
          </label>
          <button disabled={disabled || view.isPending} onClick={() => view.mutate()} className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold disabled:opacity-50">
            {view.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />} View ledger
          </button>
          <button disabled={!rows.length} onClick={downloadCsv} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> Download CSV
          </button>
        </div>

        {ledger && (
          rows.length ? (
            <div className="overflow-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any, i: number) => (
                    <tr key={r.id ?? i} className="border-t border-border">
                      <td className="px-3 py-2 whitespace-nowrap">{String(r.created_at ?? r.date ?? "—").slice(0, 19).replace("T", " ")}</td>
                      <td className="px-3 py-2 capitalize">{String(r.type ?? "—")}</td>
                      <td className="px-3 py-2 capitalize">{String(r.status ?? "—")}</td>
                      <td className="px-3 py-2 text-right tabular-nums">₦{Number(r.amount ?? 0).toLocaleString()}</td>
                      <td className="px-3 py-2">{String(r.description ?? r.note ?? r.reference ?? "—")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No ledger entries in this range.</p>
          )
        )}
      </div>
    </div>
  );
}

function UserContextPanel({ ctx, userId }: { ctx: any; userId: string }) {
  const u = ctx?.user ?? ctx?.profile ?? ctx ?? {};
  const stats: Array<[string, any]> = [
    ["Status", u.user_status ?? u.status ?? "—"],
    ["Rating", u.rating ?? "—"],
    ["Tasks posted", ctx?.tasks_posted ?? ctx?.stats?.tasks_posted ?? "—"],
    ["Tasks done", ctx?.tasks_completed ?? ctx?.stats?.tasks_completed ?? "—"],
    ["Disputes", ctx?.disputes ?? ctx?.dispute_count ?? ctx?.stats?.disputes ?? "—"],
    ["Reports", ctx?.reports ?? ctx?.report_count ?? ctx?.stats?.reports ?? "—"],
    ["Wallet", ctx?.wallet?.withdrawable_balance ?? ctx?.wallet_balance ?? "—"],
    ["KYC", (u.kyc_verified ?? ctx?.kyc_verified) ? "Verified" : "Not verified"],
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-ink">{u.name ?? u.full_name ?? `User ${userId}`}</h3>
        <p className="text-xs text-muted-foreground">{[u.email, u.phone, u.user_id ?? userId].filter(Boolean).join(" · ")}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {stats.map(([label, v]) => (
          <div key={label} className="rounded-lg border border-border bg-background p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="text-sm font-semibold text-ink truncate">{typeof v === "number" && label === "Wallet" ? `₦${v.toLocaleString()}` : String(v)}</div>
          </div>
        ))}
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">Raw context</summary>
        <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-3">{JSON.stringify(ctx, null, 2)}</pre>
      </details>
    </div>
  );
}
