import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, AlertTriangle, CheckCircle2, RotateCcw, Scale } from "lucide-react";
import { toast } from "sonner";
import { adminListDisputes, adminResolveDispute } from "@/lib/findtask.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/disputes")({
  component: AdminDisputesPage,
});

type Resolution = "release_to_tasker" | "refund_poster" | "split";

function AdminDisputesPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState<string>("open");
  const listFn = useServerFn(adminListDisputes);
  const resolveFn = useServerFn(adminResolveDispute);

  const q = useQuery({
    queryKey: ["admin-disputes", status, token],
    enabled: !!token,
    queryFn: () => listFn({ data: { token: token!, status } }),
  });

  const items: any[] = q.data?.ok ? ((q.data.data as any)?.disputes ?? (q.data.data as any)?.results ?? (Array.isArray(q.data.data) ? q.data.data : [])) : [];
  const err = q.data && !q.data.ok ? q.data.error : null;

  const resolve = useMutation({
    mutationFn: (v: { taskId: string; resolution: Resolution; note: string }) =>
      resolveFn({ data: { taskId: v.taskId, resolution: v.resolution, note: v.note, token: token! } }),
    onSuccess: (r) => {
      if (r.ok) { toast.success("Dispute resolved"); q.refetch(); }
      else toast.error(r.error);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-ink flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" /> Disputes
        </h2>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
        >
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="all">All</option>
        </select>
      </div>

      {q.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Loading disputes…</div>
      ) : err ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{err}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No disputes to show.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((d) => (
            <DisputeRow key={String(d.task_id ?? d.id)} d={d} onResolve={(res, note) => resolve.mutate({ taskId: String(d.task_id ?? d.id), resolution: res, note })} pending={resolve.isPending} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DisputeRow({ d, onResolve, pending }: { d: any; onResolve: (r: Resolution, note: string) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">Task #{d.task_id ?? d.id}</div>
          <div className="font-semibold text-ink">{d.task_title ?? d.title ?? "Task in dispute"}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Raised by <span className="font-medium">{d.raised_by_name ?? d.raised_by ?? "user"}</span>
            {d.created_at ? ` · ${new Date(d.created_at).toLocaleString()}` : ""}
          </div>
          {d.reason && <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap">{d.reason}</p>}
          {Array.isArray(d.evidence_urls) && d.evidence_urls.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {d.evidence_urls.map((u: string, i: number) => (
                <a key={i} href={u} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Evidence {i + 1}</a>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-800 dark:text-yellow-200">{d.status ?? "open"}</span>
          {d.amount && <span className="text-sm font-semibold">₦{Number(d.amount).toLocaleString()}</span>}
        </div>
      </div>
      {d.status !== "resolved" && (
        <div className="mt-3 border-t border-border pt-3">
          {!open ? (
            <button onClick={() => setOpen(true)} className="text-xs font-semibold text-primary inline-flex items-center gap-1">
              <Scale className="h-3.5 w-3.5" /> Resolve dispute
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Resolution note (visible in audit log)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                rows={2}
              />
              <div className="flex flex-wrap gap-2">
                <button disabled={pending} onClick={() => onResolve("release_to_tasker", note)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Release to Tasker
                </button>
                <button disabled={pending} onClick={() => onResolve("refund_poster", note)} className="inline-flex items-center gap-1 rounded-lg bg-amber-600 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
                  <RotateCcw className="h-3.5 w-3.5" /> Refund Poster
                </button>
                <button disabled={pending} onClick={() => onResolve("split", note)} className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
                  <Scale className="h-3.5 w-3.5" /> Split 50/50
                </button>
                <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground px-2">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
