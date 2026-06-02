import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Clock, Banknote, Tag, Loader2 } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { getTask } from "@/lib/findtask.functions";
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
  const fetchTask = useServerFn(getTask);
  const { token } = useAuth();

  const { data, isFetching } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask({ data: { taskId } }),
  });

  const task: any = data?.ok ? (data.data as any)?.task ?? data.data : null;

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
          <div className="mt-8 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {data?.error ?? "Task not found."}
          </div>
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
            </div>

            <aside className="rounded-2xl border border-border bg-card p-6 h-fit">
              <div className="text-sm text-muted-foreground">Task budget</div>
              <div className="mt-1 flex items-center gap-2 text-3xl font-bold">
                <Banknote className="h-6 w-6 text-primary" />
                ₦{Number(task.budget ?? 0).toLocaleString()}
              </div>
              {task.status && (
                <div className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">
                  {task.status}
                </div>
              )}
              <button
                disabled={!token}
                className="mt-5 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {token ? "Apply for this task" : "Log in to apply"}
              </button>
              {!token && (
                <Link to="/login" className="mt-2 block text-center text-xs text-muted-foreground hover:text-foreground">
                  Don't have an account? <span className="text-primary font-medium">Sign up</span>
                </Link>
              )}
            </aside>
          </article>
        )}
      </main>
    </div>
  );
}
