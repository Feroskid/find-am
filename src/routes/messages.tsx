import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { useAuth } from "@/lib/auth";
import { myTasks, myApplications } from "@/lib/findtask.functions";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Find-task" }] }),
  component: MessagesPage,
});

function extract(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.tasks ?? d.applications ?? d.data ?? d.results ?? [];
}

function MessagesPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!token) navigate({ to: "/login", search: { redirect: "/messages" } as any });
  }, [token, navigate]);

  const mt = useServerFn(myTasks);
  const ma = useServerFn(myApplications);
  const tasksQ = useQuery({ queryKey: ["msg", "posted", token], enabled: !!token, queryFn: () => mt({ data: { token: token! } }) });
  const appsQ = useQuery({ queryKey: ["msg", "apps", token], enabled: !!token, queryFn: () => ma({ data: { token: token! } }) });

  if (!token) return null;

  const posted = tasksQ.data?.ok ? extract(tasksQ.data.data) : [];
  const apps = appsQ.data?.ok ? extract(appsQ.data.data) : [];

  // Merge into unique thread list
  const threads = new Map<string, { id: string; title: string; role: "poster" | "tasker"; status?: string }>();
  posted.forEach((t: any) => {
    const id = String(t.task_id ?? t.id);
    threads.set(id, { id, title: t.title ?? "Untitled", role: "poster", status: t.status });
  });
  apps.forEach((a: any) => {
    const id = String(a.task_id ?? a.task?.id ?? a.id);
    const title = a.task?.title ?? a.title ?? "Untitled";
    if (!threads.has(id)) threads.set(id, { id, title, role: "tasker", status: a.status });
  });
  const list = [...threads.values()];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 flex-1">
        <h1 className="text-2xl font-bold tracking-tight inline-flex items-center gap-2">
          <MessageSquare className="h-6 w-6" /> Messages
        </h1>
        <p className="mt-1 text-muted-foreground">Conversations across your tasks and applications.</p>

        <div className="mt-6 space-y-2">
          {tasksQ.isFetching || appsQ.isFetching ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No conversations yet. <Link to="/tasks/browse" className="text-primary font-medium">Browse tasks</Link>
            </div>
          ) : (
            list.map((t) => (
              <Link
                key={t.id}
                to="/tasks/$taskId/workspace"
                params={{ taskId: t.id }}
                className="block rounded-xl border border-border bg-card p-4 hover:border-primary"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 capitalize">{t.role} · {t.status ?? "open"}</div>
                  </div>
                  <span className="text-xs text-primary">Open →</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
