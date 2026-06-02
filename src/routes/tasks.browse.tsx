import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { TaskCard, type TaskCardData } from "@/components/TaskCard";
import { listTasks } from "@/lib/findtask.functions";
import { FALLBACK_CATEGORIES } from "@/lib/findtask-categories";

export const Route = createFileRoute("/tasks/browse")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q : "",
    category: typeof s.category === "string" ? s.category : "",
  }),
  head: () => ({
    meta: [
      { title: "Browse tasks — Find-task" },
      { name: "description", content: "Browse open tasks across Nigeria and find work that matches your skills." },
    ],
  }),
  component: BrowseTasks,
});

function BrowseTasks() {
  const { q, category } = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState(q);
  const list = useServerFn(listTasks);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["tasks", "list", q, category],
    queryFn: () => list({ data: { q: q || undefined, category: category || undefined, page: 1 } }),
  });

  const tasks: TaskCardData[] = (() => {
    if (!data || !data.ok) return [];
    const d: any = data.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.tasks)) return d.tasks;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d?.results)) return d.results;
    return [];
  })();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Browse tasks</h1>
            <p className="mt-1 text-muted-foreground">Find work that matches your skills</p>
          </div>
          <Link
            to="/post-task"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Post a task
          </Link>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/tasks/browse", search: { q: query, category } });
            refetch();
          }}
          className="mt-6 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks (e.g. plumber, logo design)"
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <button type="submit" className="text-sm font-semibold text-primary">Search</button>
        </form>

        {/* Category chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/tasks/browse"
            search={{ q, category: "" }}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              !category ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
            }`}
          >
            All
          </Link>
          {FALLBACK_CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to="/tasks/browse"
              search={{ q, category: c.slug }}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                category === c.slug ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>

        <div className="mt-8">
          {isFetching ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading tasks…</div>
          ) : data && !data.ok ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              Couldn't load tasks: {data.error}
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No tasks found yet. Be the first to <Link to="/post-task" className="text-primary font-medium">post one</Link>.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tasks.map((t: any, i) => (
                <TaskCard key={t.task_id ?? t.id ?? i} task={{
                  id: t.task_id ?? t.id ?? i,
                  title: t.title ?? "Untitled task",
                  description: t.description,
                  budget: t.budget,
                  location: t.location,
                  category: t.category,
                  deadline: t.deadline,
                  status: t.status,
                }} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
