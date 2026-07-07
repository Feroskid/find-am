import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Users, Snowflake, Ban, RotateCcw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { adminBanUser, adminFreezeUser, adminReactivateUser, adminViewLedger } from "@/lib/findtask.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { token } = useAuth();
  const [userId, setUserId] = useState("");
  const [ledger, setLedger] = useState<any>(null);

  const freezeFn = useServerFn(adminFreezeUser);
  const banFn = useServerFn(adminBanUser);
  const reactFn = useServerFn(adminReactivateUser);
  const ledgerFn = useServerFn(adminViewLedger);

  const wrap = (fn: any, label: string) =>
    useMutation({
      mutationFn: () => fn({ data: { userId, token: token! } }),
      onSuccess: (r: any) => r.ok ? toast.success(`${label} succeeded`) : toast.error(r.error),
    });

  const freeze = wrap(freezeFn, "Freeze");
  const ban = wrap(banFn, "Ban");
  const react = wrap(reactFn, "Reactivate");
  const view = useMutation({
    mutationFn: () => ledgerFn({ data: { userId, token: token! } }),
    onSuccess: (r: any) => { if (r.ok) setLedger(r.data); else toast.error(r.error); },
  });

  const disabled = !userId.trim();
  const busy = freeze.isPending || ban.isPending || react.isPending || view.isPending;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-ink flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> User management</h2>

      <div className="rounded-xl border border-border bg-card p-4">
        <label className="text-xs font-semibold text-muted-foreground uppercase">User ID</label>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="e.g. 42"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button disabled={disabled || busy} onClick={() => freeze.mutate()} className="inline-flex items-center gap-1 rounded-lg bg-sky-600 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
            <Snowflake className="h-3.5 w-3.5" /> Freeze (3 days)
          </button>
          <button disabled={disabled || busy} onClick={() => ban.mutate()} className="inline-flex items-center gap-1 rounded-lg bg-destructive text-destructive-foreground px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
            <Ban className="h-3.5 w-3.5" /> Ban
          </button>
          <button disabled={disabled || busy} onClick={() => react.mutate()} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
            <RotateCcw className="h-3.5 w-3.5" /> Reactivate
          </button>
          <button disabled={disabled || busy} onClick={() => view.mutate()} className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
            <Wallet className="h-3.5 w-3.5" /> View ledger
          </button>
          {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center" />}
        </div>
      </div>

      {ledger && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold text-ink mb-2">Ledger — user {userId}</h3>
          <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-auto max-h-[500px] whitespace-pre-wrap">{JSON.stringify(ledger, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
