import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft, MapPin, Clock, Banknote, Tag, Loader2, Users, MessageSquare,
  Globe, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { TaskHeader } from "@/components/TaskHeader";
import { getTask, applyToTask } from "@/lib/findtask.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/tasks/$taskId")({
  head: () => ({
    meta: [
      { title: "Task — Find-task" },
      { name: "description", content: "View task details and apply on Find-task." },
    ],
  }),
  component: TaskDetail,
});

function TaskDetail() {
  const { taskId } = Route.useParams();
  const { token, user } = useAuth();
  const fetchTask = useServerFn(getTask);
  const apply = useServerFn(applyToTask);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask({ data: { taskId } }),
  });

  const task: any = data?.ok ? ((data.data as any)?.task ?? data.data) : null;
  const myId = (user as any)?.user_id ?? (user as any)?.id;
  const posterId = task?.poster_id ?? task?.user_id ?? task?.owner_id;
  const isPoster = !!task && posterId !== undefined && String(posterId) === String(myId);

  // Detect existing application from server response (varied shapes)
  const myApplication: any = (() => {
    const t: any = task;
    if (!t) return null;
    if (t.my_application) return t.my_application;
    const apps: any[] = t.applications ?? [];
    return apps.find((a) => String(a.applicant_id ?? a.tasker_id ?? a.user_id) === String(myId)) ?? null;
  })();

  const [showApply, setShowApply] = useState(false);
  const [message, setMessage] = useState("");

  const applyM = useMutation({
    mutationFn: () =>
      apply({ data: { taskId, token: token!, message: message.trim() || undefined } }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Application sent!");
        setShowApply(false); setMessage("");
        refetch();
      } else toast.error(r.error);
    },
  });

  const status = String(task?.status ?? "").toLowerCase();
  const location = task?.location_text ?? task?.location;
  const category = task?.category_name ?? task?.category;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 flex-1">
        <Link
          to="/tasks/browse"
          search={{ q: "", category_id: 0, location: "", is_remote: 0, page: 1 }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to tasks
        </Link>

        {isFetching && !task ? (
          <div className="mt-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : !data?.ok ? (
          <div className="mt-8 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{data?.error ?? "Task not found."}</div>
        ) : !task ? (
          <div className="mt-8 text-muted-foreground">No task data.</div>
        ) : (
          <article className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{task.title ?? "Untitled task"}</h1>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                {task.is_remote ? (
                  <span className="inline-flex items-center gap-1"><Globe className="h-4 w-4" />Remote</span>
                ) : location ? (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{location}</span>
                ) : null}
                {task.deadline && (
                  <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{new Date(task.deadline).toLocaleString()}</span>
                )}
                {category && (
                  <span className="inline-flex items-center gap-1"><Tag className="h-4 w-4" />{category}</span>
                )}
                {task.poster_name && (
                  <span>Posted by <span className="font-medium text-foreground">{task.poster_name}</span></span>
                )}
              </div>
              <div className="mt-6 whitespace-pre-wrap text-foreground/90">
                {task.description ?? "No description provided."}
              </div>
            </div>

            <aside className="rounded-2xl border border-border bg-card p-6 h-fit space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Task budget</div>
                <div className="mt-1 flex items-center gap-2 text-3xl font-bold">
                  <Banknote className="h-6 w-6 text-primary" />
                  ₦{Number(task.budget ?? 0).toLocaleString()}
                </div>
                {status && (
                  <div className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">{status}</div>
                )}
              </div>

              {isPoster ? (
                <div className="space-y-2">
                  <Link to="/tasks/$taskId/applications" params={{ taskId }} className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                    <Users className="h-4 w-4" /> View applications
                  </Link>
                  <Link to="/tasks/$taskId/workspace" params={{ taskId }} className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
                    <MessageSquare className="h-4 w-4" /> Open workspace
                  </Link>
                </div>
              ) : !token ? (
                <Link to="/login" search={{ redirect: `/tasks/${taskId}` } as any} className="w-full inline-flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  Log in to apply
                </Link>
              ) : myApplication ? (
                <div className="space-y-2">
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                    <div className="inline-flex items-center gap-1.5 font-semibold text-primary">
                      <CheckCircle2 className="h-4 w-4" /> Application sent
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground capitalize">
                      Status: {String(myApplication.status ?? "pending")}
                    </div>
                  </div>
                  <Link to="/tasks/$taskId/workspace" params={{ taskId }} className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
                    <MessageSquare className="h-4 w-4" /> Open conversation
                  </Link>
                </div>
              ) : status && status !== "open" ? (
                <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                  This task is {status} and not accepting new applications.
                </div>
              ) : !showApply ? (
                <button onClick={() => setShowApply(true)} className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  Apply for this task
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="Why are you a great fit? Mention experience and how soon you can start."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => applyM.mutate()}
                    disabled={applyM.isPending}
                    className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {applyM.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {applyM.isPending ? "Submitting…" : "Submit application"}
                  </button>
                  <button onClick={() => setShowApply(false)} className="w-full text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                </div>
              )}
            </aside>
          </article>
        )}
      </main>
    </div>
  );
}
