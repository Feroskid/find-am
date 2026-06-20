import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Plus, ChevronDown, MapPin, Clock, Globe } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { Footer } from "@/components/Footer";
import { getUserTasks } from "@/lib/findtask.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/tasks/mine")({
  head: () => ({ meta: [{ title: "My tasks — Find-task" }] }),
  component: MyTasksPage,
});

const FILTERS = ["All", "Open", "Assigned", "Completed", "Cancelled"] as const;

function MyTasksPage() {
  const { token, ready, user } = useAuth();
  const navigate = useNavigate();
  const userTasks = useServerFn(getUserTasks);
  const myId = (user as any)?.user_id ?? (user as any)?.id;
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  useEffect(() => {
    if (ready && !token) navigate({ to: "/login", search: { redirect: "/tasks/mine" } as any });
  }, [token, ready, navigate]);

  const myTasksQ = useQuery({
    queryKey: ["my-tasks", myId],
    enabled: !!token && !!myId,
    queryFn: () => userTasks({ data: { userId: String(myId) } }),
  });

  const rows: any[] = (() => {
    const d: any = myTasksQ.data?.ok ? myTasksQ.data.data : null;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    return d.tasks ?? d.results ?? d.data ?? d.items ?? d.posted_tasks ?? d.user_tasks ?? d.my_tasks ?? [];
  })();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((t) => {
      const s = String(t.status ?? "open").toLowerCase();
      if (filter !== "All" && s !== filter.toLowerCase() && !(filter === "Assigned" && (s === "in_progress" || s === "accepted"))) return false;
      if (!term) return true;
      return String(t.title ?? "").toLowerCase().includes(term);
    });
  }, [rows, q, filter]);

  if (!token) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 flex-1">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <h1 className="font-display text-3xl sm:text-4xl text-ink">My tasks</h1>
          <Link to="/post-task" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Post a task
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 flex-1 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for a task"
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="appearance-none rounded-full border border-border bg-card pl-4 pr-8 py-2 text-sm font-semibold"
            >
              {FILTERS.map((f) => <option key={f} value={f}>{f} tasks</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="mt-6">
          {myTasksQ.isFetching ? (
            <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
              <h2 className="font-display text-2xl text-ink">You haven't posted any tasks yet</h2>
              <p className="mt-2 text-muted-foreground">Get started on Find-task by posting a task.</p>
              <Link to="/post-task" className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90">
                <Plus className="h-4 w-4" /> Post a task
              </Link>
            </div>
          ) : (
            <ul className="grid gap-3">
              {filtered.map((t) => {
                const id = t.task_id ?? t.id;
                const remote = !!t.is_remote;
                const loc = t.location_text ?? t.location;
                const status = String(t.status ?? "open").toLowerCase();
                const offers = t.offers_count ?? t.applications_count ?? 0;
                return (
                  <li key={id}>
                    <Link
                      to="/tasks/$taskId"
                      params={{ taskId: String(id) }}
                      className="block rounded-2xl border border-border bg-card p-4 hover:border-primary hover:shadow-sm transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-ink leading-snug">{t.title ?? "Untitled task"}</h3>
                        <span className="font-display text-xl text-ink shrink-0">₦{Number(t.budget ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          {remote ? <Globe className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                          {remote ? "Remote" : (loc ?? "On-site")}
                        </span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{t.deadline ? new Date(t.deadline).toLocaleDateString() : "Flexible"}</span>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary capitalize">{status.replace("_", " ")}</span>
                        <span>· {offers} offer{Number(offers) === 1 ? "" : "s"}</span>
                      </div>
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
