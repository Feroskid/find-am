import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Loader2, MessageSquare, Briefcase, Wrench } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { Footer } from "@/components/Footer";
import { getUserTasks } from "@/lib/findtask.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Find-task" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { token, ready, user, mode } = useAuth();
  const navigate = useNavigate();
  const userTasks = useServerFn(getUserTasks);
  const myId = (user as any)?.user_id ?? (user as any)?.id;
  const isPoster = mode === "poster";

  useEffect(() => {
    if (ready && !token) navigate({ to: "/login", search: { redirect: "/messages" } as any });
  }, [token, ready, navigate]);

  // Pull both poster + tasker task lists so a user can switch modes and still
  // see all relevant conversations.
  const posterQ = useQuery({
    queryKey: ["messages", "poster-tasks", myId],
    enabled: !!token && !!myId,
    queryFn: () => userTasks({ data: { userId: String(myId), token, role: "poster" } }),
  });
  const taskerQ = useQuery({
    queryKey: ["messages", "tasker-tasks", myId],
    enabled: !!token && !!myId,
    queryFn: () => userTasks({ data: { userId: String(myId), token, role: "tasker" } }),
  });

  const list = useMemo(() => {
    const out: any[] = [];
    const push = (arr: any[], role: "poster" | "tasker") => {
      arr.forEach((t) => {
        const status = String(t.status ?? "open").toLowerCase();
        // Show conversations only for active or completed engagements.
        if (!["assigned", "in_progress", "accepted", "completed", "escrow"].includes(status)) return;
        out.push({ ...t, _role: role });
      });
    };
    const pData: any = posterQ.data?.ok ? posterQ.data.data : null;
    const tData: any = taskerQ.data?.ok ? taskerQ.data.data : null;
    push((pData?.tasks ?? []) as any[], "poster");
    push((tData?.tasks ?? []) as any[], "tasker");
    // Dedupe by task id, prefer the current mode role.
    const map = new Map<string, any>();
    out.forEach((t) => {
      const k = String(t.task_id ?? t.id);
      if (!k) return;
      const prev = map.get(k);
      if (!prev || (isPoster ? t._role === "poster" : t._role === "tasker")) map.set(k, t);
    });
    return Array.from(map.values()).sort((a, b) => {
      const ax = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
      const bx = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
      return bx - ax;
    });
  }, [posterQ.data, taskerQ.data, isPoster]);

  const loading = posterQ.isFetching || taskerQ.isFetching;
  if (!token) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 flex-1">
        <h1 className="font-display text-3xl text-ink inline-flex items-center gap-2">
          <MessageSquare className="h-6 w-6" /> Messages
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conversations from your assigned and completed tasks.
        </p>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading conversations…
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-muted-foreground">
                No active conversations yet. Once an offer is accepted, the thread will appear here.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <Link to="/tasks/browse" search={{ q: "", category_id: 0, location: "", is_remote: 0, page: 1 } as any} className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">
                  Browse tasks
                </Link>
                <Link to="/dashboard" className="rounded-full border border-border px-5 py-2 text-sm font-bold">
                  Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {list.map((t) => {
                const id = String(t.task_id ?? t.id);
                const status = String(t.status ?? "open").toLowerCase();
                return (
                  <li key={id}>
                    <Link
                      to="/tasks/$taskId/workspace"
                      params={{ taskId: id }}
                      className="flex items-center gap-3 p-4 hover:bg-muted/40"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                        {t._role === "poster" ? <Briefcase className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-ink truncate">{t.title ?? "Task"}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {t._role === "poster" ? "You posted" : "You're assigned"} · {status.replace("_", " ")}
                        </div>
                      </div>
                      <span className="font-display text-lg text-ink shrink-0">
                        ₦{Number(t.budget ?? 0).toLocaleString()}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
