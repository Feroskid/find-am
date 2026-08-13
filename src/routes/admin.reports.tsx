import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Flag, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { adminListReports, adminResolveReport } from "@/lib/findtask.functions";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Task reports — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminReportsPage,
});

function list(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.reports ?? d.results ?? d.data ?? [];
}

function AdminReportsPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState("open");
  const listFn = useServerFn(adminListReports);
  const resolveFn = useServerFn(adminResolveReport);

  const q = useQuery({
    queryKey: ["admin", "reports", status, token],
    enabled: !!token,
    queryFn: () => listFn({ data: { token: token!, status } }),
  });

  const resolveM = useMutation({
    mutationFn: (v: { reportId: string; dismiss: boolean }) =>
      resolveFn({ data: { reportId: v.reportId, dismiss: v.dismiss, token: token! } }),
    onSuccess: (r: any) => {
      if (r?.ok) { toast.success("Report updated"); q.refetch(); }
      else toast.error(r?.error ?? "Could not update report");
    },
  });

  const items = q.data?.ok ? list(q.data.data) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink inline-flex items-center gap-2"><Flag className="h-5 w-5 text-primary" /> Task reports</h2>
          <p className="text-sm text-muted-foreground">Reports users filed against tasks — separate from money disputes.</p>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm">
          <option value="open">Open</option>
          <option value="reviewed">Reviewed</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All</option>
        </select>
      </div>

      {q.isPending ? (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading reports…</div>
      ) : !q.data?.ok ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(q.data as any)?.error}</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No {status === "all" ? "" : status} reports.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((r: any) => {
            const id = String(r.report_id ?? r.id);
            return (
              <li key={id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Report #{id} · Task #{r.task_id}</div>
                    <div className="font-semibold text-ink">{r.task_title ?? r.reason ?? "Reported task"}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      By {r.reporter_name ?? r.reporter_id ?? "user"}{r.created_at ? ` · ${new Date(r.created_at).toLocaleString()}` : ""}
                    </div>
                    {r.reason && <p className="mt-2 text-sm">{r.reason}</p>}
                    {r.description && <p className="mt-1 text-sm text-foreground/80 whitespace-pre-wrap">{r.description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider rounded bg-muted px-2 py-0.5">{r.status ?? "open"}</span>
                    {r.task_id != null && (
                      <Link to="/tasks/$taskId" params={{ taskId: String(r.task_id) }} className="text-xs text-primary underline">View task</Link>
                    )}
                  </div>
                </div>
                {(r.status ?? "open") === "open" && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    <button
                      disabled={resolveM.isPending}
                      onClick={() => resolveM.mutate({ reportId: id, dismiss: false })}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark reviewed
                    </button>
                    <button
                      disabled={resolveM.isPending}
                      onClick={() => resolveM.mutate({ reportId: id, dismiss: true })}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Dismiss
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
