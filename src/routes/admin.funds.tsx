import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Snowflake, Sun, Banknote } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { adminFreezeTaskFunds, adminUnfreezeTaskFunds } from "@/lib/findtask.functions";
import { AdminUserSearch } from "@/components/admin/AdminUserSearch";

export const Route = createFileRoute("/admin/funds")({
  head: () => ({ meta: [{ title: "Held funds — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminFundsPage,
});

function AdminFundsPage() {
  const { token } = useAuth();
  const [taskId, setTaskId] = useState("");
  const [picked, setPicked] = useState<any>(null);
  const [reason, setReason] = useState("");
  const freezeFn = useServerFn(adminFreezeTaskFunds);
  const unfreezeFn = useServerFn(adminUnfreezeTaskFunds);
  const [log, setLog] = useState<string[]>([]);

  const run = (fn: any, label: string) =>
    useMutation({
      mutationFn: () => fn({ data: { taskId, reason: reason.trim() || undefined, token: token! } }),
      onSuccess: (r: any) => {
        if (r?.ok) {
          const why = reason.trim();
          toast.success(`${label} succeeded for task #${taskId}`);
          setLog((l) => [
            `${new Date().toLocaleTimeString()} — ${label} · task #${taskId}${why ? ` · ${why}` : ""}`,
            ...l,
          ]);
          setReason("");
        } else toast.error(r?.error ?? `${label} failed`);
      },
    });

  const freeze = run(freezeFn, "Freeze funds");
  const unfreeze = run(unfreezeFn, "Unfreeze funds");
  const busy = freeze.isPending || unfreeze.isPending;

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="font-display text-xl text-ink inline-flex items-center gap-2"><Banknote className="h-5 w-5 text-primary" /> Held funds</h2>
        <p className="text-sm text-muted-foreground">Hold or release a task's wallet credit outside a dispute. Every action is audited.</p>
      </div>

      <AdminUserSearch onPick={setPicked} label="Look up the user first (optional)" />
      {picked && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <div className="font-semibold text-ink">{picked.name ?? picked.full_name ?? "Selected user"}</div>
          <div className="text-xs text-muted-foreground">
            {[picked.email, picked.phone, picked.user_id ?? picked.id].filter(Boolean).join(" · ")}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Task ID</span>
          <input
            value={taskId}
            onChange={(e) => setTaskId(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="e.g. 48"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Reason for action (optional)</span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Investigating a payment complaint"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={!taskId || busy}
            onClick={() => freeze.mutate()}
            className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {freeze.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Snowflake className="h-4 w-4" />} Freeze funds
          </button>
          <button
            disabled={!taskId || busy}
            onClick={() => unfreeze.mutate()}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {unfreeze.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sun className="h-4 w-4" />} Unfreeze funds
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Freezing stops the tasker withdrawing the task's credit while you investigate. Unfreezing puts it back into their available balance.
        </p>
      </div>

      {log.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-ink">This session</h3>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {log.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
