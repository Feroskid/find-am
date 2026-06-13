import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle, Star } from "lucide-react";
import { toast } from "sonner";
import { TaskHeader } from "@/components/TaskHeader";
import { useAuth } from "@/lib/auth";
import { getTask, listTaskApplications, acceptApplicant } from "@/lib/findtask.functions";

export const Route = createFileRoute("/tasks/$taskId/applications")({
  head: () => ({ meta: [{ title: "Applications — Find-task" }] }),
  component: ApplicationsPage,
});

function extract(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.applications ?? d.applicants ?? d.results ?? d.data ?? [];
}

function ApplicationsPage() {
  const { taskId } = Route.useParams();
  const { token, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && !token) navigate({ to: "/login", search: { redirect: `/tasks/${taskId}/applications` } as any });
  }, [token, taskId, navigate]);

  const tFn = useServerFn(getTask);
  const aFn = useServerFn(listTaskApplications);
  const acc = useServerFn(acceptApplicant);

  const taskQ = useQuery({ queryKey: ["task", taskId], queryFn: () => tFn({ data: { taskId } }) });
  const appsQ = useQuery({
    queryKey: ["task", taskId, "apps", token],
    enabled: !!token,
    queryFn: () => aFn({ data: { taskId, token: token! } }),
  });

  const acceptM = useMutation({
    mutationFn: (taskerId: string) => acc({ data: { taskId, taskerId, token: token! } }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Tasker accepted. Escrow initialised.");
        navigate({ to: "/tasks/$taskId/workspace", params: { taskId } });
      } else toast.error(r.error);
    },
  });

  if (!token) return null;
  const task: any = taskQ.data?.ok ? ((taskQ.data.data as any)?.task ?? taskQ.data.data) : null;
  const apps = appsQ.data?.ok ? extract(appsQ.data.data) : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 flex-1">
        <Link to="/tasks/$taskId" params={{ taskId }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to task
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Applications</h1>
        {task && <p className="text-muted-foreground">{task.title}</p>}

        <div className="mt-6 space-y-3">
          {appsQ.isFetching ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : !appsQ.data?.ok ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{appsQ.data?.error}</div>
          ) : apps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No applications yet.</div>
          ) : (
            apps.map((a: any, i: number) => {
              const aid = String(a.tasker_id ?? a.applicant_id ?? a.user_id ?? a.id ?? i);
              const name = a.tasker_name ?? a.applicant?.name ?? a.name ?? "Tasker";
              const rating = a.rating ?? a.tasker_rating;
              const status = String(a.status ?? "pending").toLowerCase();
              const isAccepted = status === "accepted";
              return (
                <div key={aid} className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center font-semibold">
                    {String(name).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-medium">{name}</div>
                      {rating && (
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {Number(rating).toFixed(1)}
                        </span>
                      )}
                      <span className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 ${isAccepted ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {status}
                      </span>
                    </div>
                    {a.message && (
                      <p className="mt-1 text-sm text-foreground/80 whitespace-pre-wrap">{a.message}</p>
                    )}
                  </div>
                  {isAccepted ? (
                    <Link to="/tasks/$taskId/workspace" params={{ taskId }} className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold hover:bg-muted">
                      Workspace
                    </Link>
                  ) : (
                    <button
                      disabled={acceptM.isPending}
                      onClick={() => acceptM.mutate(aid)}
                      className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      {acceptM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Accept
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-8 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-foreground/80 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <span>Accepting a tasker locks the budget in Paystack escrow. Funds release to the tasker after you mark the task complete.</span>
        </div>
      </main>
    </div>
  );
}
