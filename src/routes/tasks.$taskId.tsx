import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, MapPin, Clock, Banknote, Tag, Loader2, Users, MessageSquare, Star, Award } from "lucide-react";
import { toast } from "sonner";
import { TaskHeader } from "@/components/TaskHeader";
import {
  getTask, applyToTask, getTaskerRatings, getTaskerBadges,
} from "@/lib/findtask.functions";
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
  const ratingsFn = useServerFn(getTaskerRatings);
  const badgesFn = useServerFn(getTaskerBadges);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask({ data: { taskId } }),
  });

  const task: any = data?.ok ? ((data.data as any)?.task ?? data.data) : null;
  const myId = (user as any)?.id ?? (user as any)?.user_id;
  const isPoster = !!task && (task.poster_id ?? task.user_id ?? task.owner_id) === myId;
  const posterId = task?.poster_id ?? task?.user_id ?? task?.owner_id;

  const ratingsQ = useQuery({
    queryKey: ["tasker", posterId, "ratings"],
    enabled: !!posterId,
    queryFn: () => ratingsFn({ data: { taskerId: String(posterId) } }),
  });
  const badgesQ = useQuery({
    queryKey: ["tasker", posterId, "badges"],
    enabled: !!posterId,
    queryFn: () => badgesFn({ data: { taskerId: String(posterId) } }),
  });

  const [showApply, setShowApply] = useState(false);
  const [cover, setCover] = useState("");
  const [bid, setBid] = useState<string>("");

  const applyM = useMutation({
    mutationFn: () => apply({ data: {
      taskId, token: token!,
      cover: cover.trim() || undefined,
      bid: bid ? Number(bid) : undefined,
    } }),
    onSuccess: (r) => {
      if (r.ok) { toast.success("Application sent!"); setShowApply(false); setCover(""); setBid(""); refetch(); }
      else toast.error(r.error);
    },
  });

  const ratingSummary = ratingsQ.data?.ok ? (ratingsQ.data.data as any) : null;
  const avg = ratingSummary?.average ?? ratingSummary?.avg ?? ratingSummary?.rating;
  const count = ratingSummary?.count ?? ratingSummary?.total ?? (Array.isArray(ratingSummary?.ratings) ? ratingSummary.ratings.length : undefined);
  const badges: any[] = (() => {
    const d = badgesQ.data?.ok ? (badgesQ.data.data as any) : null;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    return d.badges ?? d.data ?? [];
  })();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 flex-1">
        <Link to="/tasks/browse" search={{ q: "", category: "" }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to tasks
        </Link>

        {isFetching ? (
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
                {task.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{task.location}</span>}
                {task.deadline && <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{task.deadline}</span>}
                {task.category && <span className="inline-flex items-center gap-1"><Tag className="h-4 w-4" />{task.category}</span>}
              </div>
              <div className="mt-6 prose prose-sm max-w-none whitespace-pre-wrap text-foreground/90">
                {task.description ?? "No description provided."}
              </div>

              {(avg || badges.length > 0) && (
                <div className="mt-6 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Poster</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {avg && (
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{Number(avg).toFixed(1)}</span>
                        {count && <span className="text-muted-foreground">({count})</span>}
                      </span>
                    )}
                    {badges.map((b: any, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        <Award className="h-3 w-3" /> {b.name ?? b.label ?? b.category ?? "Badge"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-border bg-card p-6 h-fit space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Task budget</div>
                <div className="mt-1 flex items-center gap-2 text-3xl font-bold">
                  <Banknote className="h-6 w-6 text-primary" />
                  ₦{Number(task.budget ?? 0).toLocaleString()}
                </div>
                {task.status && (
                  <div className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">{task.status}</div>
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
              ) : !showApply ? (
                <button onClick={() => setShowApply(true)} className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  Apply for this task
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={cover}
                    onChange={(e) => setCover(e.target.value)}
                    rows={4}
                    placeholder="Why are you a great fit?"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={bid}
                    onChange={(e) => setBid(e.target.value)}
                    placeholder={`Your bid (₦), default ${Number(task.budget ?? 0).toLocaleString()}`}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => applyM.mutate()}
                    disabled={applyM.isPending}
                    className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
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
