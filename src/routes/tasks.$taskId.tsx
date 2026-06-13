import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft, MapPin, Clock, Banknote, Tag, Loader2, Users, MessageSquare,
  Globe, CheckCircle2, Share2, ShieldCheck, AlertTriangle, Flag, User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { TaskHeader } from "@/components/TaskHeader";
import { Footer } from "@/components/Footer";
import { TaskCard, toCardData } from "@/components/TaskCard";
import { FeeBreakdown } from "@/components/FeeBreakdown";
import { getTask, applyToTask, listTasks } from "@/lib/findtask.functions";
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

function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  if (!Number.isFinite(d)) return "";
  const s = Math.max(1, Math.floor((Date.now() - d) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24);
  return `${dd}d ago`;
}

function TaskDetail() {
  const { taskId } = Route.useParams();
  const { token, user } = useAuth();
  const fetchTask = useServerFn(getTask);
  const apply = useServerFn(applyToTask);
  const listFn = useServerFn(listTasks);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask({ data: { taskId } }),
  });

  const task: any = data?.ok ? ((data.data as any)?.task ?? data.data) : null;
  const myId = (user as any)?.user_id ?? (user as any)?.id;
  const posterId = task?.poster_id ?? task?.user_id ?? task?.owner_id;
  const isPoster = !!task && posterId !== undefined && String(posterId) === String(myId);

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

  const similarQ = useQuery({
    queryKey: ["similar", task?.category_id, taskId],
    queryFn: () => listFn({ data: { page: 1, limit: 4, category_id: task?.category_id || undefined } }),
    enabled: !!task,
  });
  const similar: any[] = (similarQ.data?.ok ? ((similarQ.data.data as any)?.tasks ?? (similarQ.data.data as any)?.results ?? []) : [])
    .filter((t: any) => String(t.task_id ?? t.id) !== String(taskId))
    .slice(0, 3);

  const status = String(task?.status ?? "").toLowerCase();
  const location = task?.location_text ?? task?.location;
  const category = task?.category_name ?? task?.category;
  const applicantCount = task?.application_count ?? task?.applications_count ?? (Array.isArray(task?.applications) ? task.applications.length : undefined);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: task?.title, url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 flex-1">
        <Link
          to="/tasks/browse"
          search={{ q: "", category_id: 0, location: "", is_remote: 0, page: 1 }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to tasks
        </Link>

        {isFetching && !task ? (
          <div className="mt-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading task…</div>
        ) : !data?.ok ? (
          <div className="mt-8 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{data?.error ?? "Task not found."}</div>
        ) : !task ? (
          <div className="mt-8 text-muted-foreground">No task data.</div>
        ) : (
          <>
            <article className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
              {/* Main column */}
              <div className="space-y-6">
                {/* Hero */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    {status && (
                      <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">{status}</span>
                    )}
                    {task.urgency && task.urgency !== "normal" && (
                      <span className="inline-flex rounded-full bg-amber-500/15 text-amber-600 px-2.5 py-0.5 text-xs font-semibold capitalize">{task.urgency}</span>
                    )}
                    <span className="text-xs text-muted-foreground">Posted {timeAgo(task.created_at ?? task.posted_at)}</span>
                  </div>
                  <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">{task.title ?? "Untitled task"}</h1>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                    <Meta icon={Banknote} label="Budget" value={`₦${Number(task.budget ?? 0).toLocaleString()}`} />
                    <Meta icon={task.is_remote ? Globe : MapPin} label={task.is_remote ? "Remote" : "Location"} value={task.is_remote ? "Anywhere" : (location ?? "Not specified")} />
                    {task.deadline && <Meta icon={Clock} label="Deadline" value={new Date(task.deadline).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} />}
                    {category && <Meta icon={Tag} label="Category" value={category} />}
                    {task.quantity > 1 && <Meta icon={Users} label="Taskers needed" value={String(task.quantity)} />}
                    {applicantCount !== undefined && <Meta icon={Users} label="Applicants" value={String(applicantCount)} />}
                  </div>
                </div>

                {/* Poster mini-card */}
                {(task.poster_name || posterId) && (
                  <Link to="/u/$userId" params={{ userId: String(posterId) }} className="block rounded-2xl border border-border bg-card p-5 hover:border-primary">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 grid place-items-center text-primary">
                        {task.poster_photo ? (
                          <img src={task.poster_photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                        ) : <UserIcon className="h-6 w-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground">Posted by</div>
                        <div className="font-semibold">{task.poster_name ?? "Find-task member"}</div>
                        {task.poster_rating && (
                          <div className="text-xs text-muted-foreground">⭐ {Number(task.poster_rating).toFixed(1)} · {task.poster_tasks_posted ?? 0} tasks posted</div>
                        )}
                      </div>
                      <span className="text-xs text-primary font-medium">View profile →</span>
                    </div>
                  </Link>
                )}

                {/* Description */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Details</h2>
                  <div className="mt-3 whitespace-pre-wrap text-foreground/90">
                    {task.description ?? "No description provided."}
                  </div>
                  {Array.isArray(task.attachments) && task.attachments.length > 0 && (
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {task.attachments.map((a: any, i: number) => (
                        <a key={i} href={a.url ?? a} target="_blank" rel="noreferrer" className="block aspect-square rounded-lg border border-border overflow-hidden bg-muted">
                          <img src={a.url ?? a} alt="" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Similar */}
                {similar.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Similar tasks</h2>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {similar.map((t: any) => (
                        <TaskCard key={t.task_id ?? t.id} task={toCardData(t)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start h-fit">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="text-sm text-muted-foreground">Task budget</div>
                  <div className="mt-1 flex items-center gap-2 text-3xl font-bold">
                    <Banknote className="h-6 w-6 text-primary" />
                    ₦{Number(task.budget ?? 0).toLocaleString()}
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Escrow-protected
                  </div>

                  <div className="mt-5">
                    {isPoster ? (
                      <div className="space-y-2">
                        <Link to="/tasks/$taskId/applications" params={{ taskId }} className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                          <Users className="h-4 w-4" /> View applications{applicantCount ? ` (${applicantCount})` : ""}
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
                          <div className="mt-1 text-xs text-muted-foreground capitalize">Status: {String(myApplication.status ?? "pending")}</div>
                        </div>
                        <Link to="/tasks/$taskId/workspace" params={{ taskId }} className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
                          <MessageSquare className="h-4 w-4" /> Open conversation
                        </Link>
                      </div>
                    ) : status && status !== "open" ? (
                      <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground inline-flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> This task is {status} and not accepting new applications.
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
                        <button onClick={() => applyM.mutate()} disabled={applyM.isPending} className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2">
                          {applyM.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                          {applyM.isPending ? "Submitting…" : "Submit application"}
                        </button>
                        <button onClick={() => setShowApply(false)} className="w-full text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button onClick={share} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium hover:bg-muted">
                      <Share2 className="h-3.5 w-3.5" /> Share
                    </button>
                    <a href="mailto:hello@find-am.com?subject=Report%20task" className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium hover:bg-muted">
                      <Flag className="h-3.5 w-3.5" /> Report
                    </a>
                  </div>
                </div>

                {Number(task.budget) > 0 && <FeeBreakdown budget={Number(task.budget)} />}
              </aside>
            </article>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/40 p-3">
      <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
