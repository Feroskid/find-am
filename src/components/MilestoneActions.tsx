import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, CheckCircle2, Banknote, Clock, Lock } from "lucide-react";
import { toast } from "sonner";
import { completeMilestone, releaseMilestone } from "@/lib/findtask.functions";

type Milestone = {
  milestone_id: number;
  title: string;
  description?: string;
  amount: number | string;
  status: "pending" | "completed" | "approved" | "paid" | string;
  due_date?: string;
};

const naira = (n: number | string) => `₦${Number(n ?? 0).toLocaleString()}`;

export function MilestoneActions({
  taskId,
  token,
  isPoster,
  isTasker,
  milestones,
  onChanged,
}: {
  taskId: string;
  token: string;
  isPoster: boolean;
  isTasker: boolean;
  milestones: Milestone[];
  onChanged: () => void; // refetch the task after any action
}) {
  const completeFn = useServerFn(completeMilestone);
  const releaseFn = useServerFn(releaseMilestone);
  const [busyId, setBusyId] = useState<number | null>(null);

  const completeM = useMutation({
    mutationFn: (milestoneId: number) => completeFn({ data: { taskId, milestoneId, token } }),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: (r: any) => {
      if (r.ok) { toast.success("Milestone marked complete"); onChanged(); }
      else toast.error(r.error);
    },
  });

  const releaseM = useMutation({
    mutationFn: (milestoneId: number) => releaseFn({ data: { taskId, milestoneId, token } }),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: (r: any) => {
      if (r.ok) { toast.success("Milestone payment released"); onChanged(); }
      else toast.error(r.error);
    },
  });

  const list = Array.isArray(milestones) ? milestones : [];
  const total = list.length;
  const paidCount = list.filter((m) => m.status === "paid").length;
  const totalValue = list.reduce((s, m) => s + Number(m.amount ?? 0), 0);
  const paidValue = list
    .filter((m) => m.status === "paid")
    .reduce((s, m) => s + Number(m.amount ?? 0), 0);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        No milestones on this task.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Milestones</h3>
        <span className="text-xs text-muted-foreground">{paidCount} of {total} released</span>
      </div>

      {/* progress bar */}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${totalValue > 0 ? (paidValue / totalValue) * 100 : 0}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {naira(paidValue)} released of {naira(totalValue)}
      </div>

      <div className="space-y-2">
        {list.map((m) => {
          const status = String(m.status ?? "pending").toLowerCase();
          const isPending = status === "pending";
          const isCompleted = status === "completed";
          const isPaid = status === "paid" || status === "approved";
          const busy = busyId === m.milestone_id;

          return (
            <div key={m.milestone_id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm text-ink truncate">{m.title}</div>
                  {m.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.description}</div>
                  )}
                  {m.due_date && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">Due {m.due_date}</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-lg text-ink">{naira(m.amount)}</div>
                  <StatusBadge status={status} />
                </div>
              </div>

              {/* Action row */}
              <div className="mt-2">
                {/* Tasker actions */}
                {isTasker && isPending && (
                  <button
                    onClick={() => completeM.mutate(m.milestone_id)}
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Mark complete
                  </button>
                )}
                {isTasker && isCompleted && (
                  <div className="w-full rounded-full bg-muted/60 px-4 py-2 text-xs text-muted-foreground text-center inline-flex items-center justify-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Awaiting poster to release
                  </div>
                )}

                {/* Poster actions */}
                {isPoster && isCompleted && (
                  <button
                    onClick={() => releaseM.mutate(m.milestone_id)}
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                    Release payment
                  </button>
                )}
                {isPoster && isPending && (
                  <div className="w-full rounded-full bg-muted/60 px-4 py-2 text-xs text-muted-foreground text-center inline-flex items-center justify-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> Awaiting tasker to complete
                  </div>
                )}

                {/* Paid — both sides */}
                {isPaid && (
                  <div className="w-full rounded-full bg-emerald-500/10 text-emerald-600 px-4 py-2 text-xs font-semibold text-center inline-flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    completed: "bg-amber-500/15 text-amber-600",
    approved: "bg-emerald-500/15 text-emerald-600",
    paid: "bg-emerald-500/15 text-emerald-600",
  };
  const label: Record<string, string> = {
    pending: "Pending",
    completed: "Awaiting release",
    approved: "Paid",
    paid: "Paid",
  };
  return (
    <span className={"inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide " + (map[status] ?? map.pending)}>
      {label[status] ?? status}
    </span>
  );
}
