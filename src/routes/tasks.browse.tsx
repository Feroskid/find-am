import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Loader2, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { TaskCard, type TaskCardData } from "@/components/TaskCard";
import { listTasks } from "@/lib/findtask.functions";
import { FALLBACK_CATEGORIES } from "@/lib/findtask-categories";

type Sort = "newest" | "price_asc" | "price_desc" | "deadline";
const SORTS: { v: Sort; label: string }[] = [
  { v: "newest", label: "Newest" },
  { v: "price_desc", label: "Price: High to low" },
  { v: "price_asc", label: "Price: Low to high" },
  { v: "deadline", label: "Deadline" },
];
const LEVELS = ["any", "entry", "intermediate", "expert"];

export const Route = createFileRoute("/tasks/browse")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q : "",
    category: typeof s.category === "string" ? s.category : "",
    level: typeof s.level === "string" ? s.level : "",
    location: typeof s.location === "string" ? s.location : "",
    min_price: typeof s.min_price === "string" || typeof s.min_price === "number" ? Number(s.min_price) || 0 : 0,
    max_price: typeof s.max_price === "string" || typeof s.max_price === "number" ? Number(s.max_price) || 0 : 0,
    sort: (typeof s.sort === "string" ? s.sort : "newest") as Sort,
    page: typeof s.page === "string" || typeof s.page === "number" ? Math.max(1, Number(s.page) || 1) : 1,
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
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState(search.q);
  const [showFilters, setShowFilters] = useState(false);
  const list = useServerFn(listTasks);

  const per_page = 12;
  const { data, isFetching } = useQuery({
    queryKey: ["tasks", "list", search],
    queryFn: () => list({ data: {
      q: search.q || undefined,
      category: search.category || undefined,
      level: search.level && search.level !== "any" ? search.level : undefined,
      location: search.location || undefined,
      min_price: search.min_price || undefined,
      max_price: search.max_price || undefined,
      sort: search.sort || undefined,
      page: search.page,
      per_page,
    } }),
  });

  const tasks: TaskCardData[] = (() => {
    if (!data || !data.ok) return [];
    const d: any = data.data;
    if (Array.isArray(d)) return d;
    return d?.tasks ?? d?.data ?? d?.results ?? [];
  })();
  const total: number = (() => {
    const d: any = data?.ok ? data.data : null;
    return d?.total ?? d?.count ?? d?.pagination?.total ?? tasks.length;
  })();
  const hasMore = tasks.length === per_page;

  const setSearch = (patch: Partial<typeof search>) =>
    navigate({ to: "/tasks/browse", search: { ...search, ...patch, page: patch.page ?? 1 } });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Browse tasks</h1>
            <p className="mt-1 text-muted-foreground">Find work that matches your skills</p>
          </div>
          <Link to="/post-task" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Post a task
          </Link>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); setSearch({ q: query }); }}
          className="mt-6 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks (e.g. plumber, logo design)"
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <button type="button" onClick={() => setShowFilters((s) => !s)} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
          <button type="submit" className="text-sm font-semibold text-primary">Search</button>
        </form>

        {showFilters && (
          <div className="mt-3 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium">
              Location
              <input
                defaultValue={search.location}
                onBlur={(e) => setSearch({ location: e.target.value })}
                placeholder="e.g. Lagos"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-medium">
              Min budget (₦)
              <input
                type="number" min={0}
                defaultValue={search.min_price || ""}
                onBlur={(e) => setSearch({ min_price: Number(e.target.value) || 0 })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-medium">
              Max budget (₦)
              <input
                type="number" min={0}
                defaultValue={search.max_price || ""}
                onBlur={(e) => setSearch({ max_price: Number(e.target.value) || 0 })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-medium">
              Level
              <select
                value={search.level || "any"}
                onChange={(e) => setSearch({ level: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm capitalize"
              >
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium sm:col-span-2 lg:col-span-1">
              Sort by
              <select
                value={search.sort}
                onChange={(e) => setSearch({ sort: e.target.value as Sort })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
              </select>
            </label>
            <button
              type="button"
              onClick={() => navigate({ to: "/tasks/browse", search: { q: "", category: "", level: "", location: "", min_price: 0, max_price: 0, sort: "newest", page: 1 } })}
              className="self-end text-xs font-medium text-muted-foreground hover:text-foreground text-left"
            >
              Clear all filters
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSearch({ category: "" })}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${!search.category ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}
          >All</button>
          {FALLBACK_CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => setSearch({ category: c.slug })}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${search.category === c.slug ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}
            >{c.label}</button>
          ))}
        </div>

        <div className="mt-8">
          {isFetching ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading tasks…</div>
          ) : data && !data.ok ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">Couldn't load tasks: {data.error}</div>
          ) : tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No tasks match those filters. <Link to="/post-task" className="text-primary font-medium">Post one</Link>.
            </div>
          ) : (
            <>
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
              <div className="mt-8 flex items-center justify-between">
                <button
                  disabled={search.page <= 1}
                  onClick={() => setSearch({ page: search.page - 1 })}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-xs text-muted-foreground">Page {search.page}{total ? ` · ${total} tasks` : ""}</span>
                <button
                  disabled={!hasMore}
                  onClick={() => setSearch({ page: search.page + 1 })}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-muted"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
