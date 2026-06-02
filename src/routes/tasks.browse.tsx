import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Loader2, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { TaskCard, toCardData } from "@/components/TaskCard";
import { listTasks, getCategories } from "@/lib/findtask.functions";

export const Route = createFileRoute("/tasks/browse")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q : "",
    category_id:
      typeof s.category_id === "string" || typeof s.category_id === "number"
        ? Number(s.category_id) || 0
        : 0,
    location: typeof s.location === "string" ? s.location : "",
    is_remote:
      typeof s.is_remote === "string" || typeof s.is_remote === "number"
        ? Number(s.is_remote) === 1 ? 1 : 0
        : 0,
    page:
      typeof s.page === "string" || typeof s.page === "number"
        ? Math.max(1, Number(s.page) || 1)
        : 1,
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
  const cats = useServerFn(getCategories);

  const limit = 12;
  const { data, isFetching } = useQuery({
    queryKey: ["tasks", "search", search],
    queryFn: () =>
      list({
        data: {
          q: search.q || undefined,
          category_id: search.category_id || undefined,
          location: search.location || undefined,
          is_remote: search.is_remote ? 1 : undefined,
          page: search.page,
          limit,
        },
      }),
  });

  const catsQ = useQuery({
    queryKey: ["categories"],
    queryFn: () => cats({}),
    staleTime: 5 * 60_000,
  });
  const categories: { category_id: number; category_name: string }[] =
    catsQ.data?.ok ? (catsQ.data.data as any)?.categories ?? [] : [];

  const rows: any[] = (() => {
    if (!data?.ok) return [];
    const d: any = data.data;
    return d?.results ?? d?.tasks ?? (Array.isArray(d) ? d : []);
  })();
  const total: number = data?.ok ? (data.data as any)?.total ?? rows.length : 0;
  const hasMore = rows.length === limit;

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
          <div className="mt-3 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
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
              Category
              <select
                value={search.category_id || 0}
                onChange={(e) => setSearch({ category_id: Number(e.target.value) || 0 })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value={0}>All categories</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium inline-flex items-center gap-2 self-end">
              <input
                type="checkbox"
                checked={!!search.is_remote}
                onChange={(e) => setSearch({ is_remote: e.target.checked ? 1 : 0 })}
              />
              Remote only
            </label>
            <button
              type="button"
              onClick={() => navigate({ to: "/tasks/browse", search: { q: "", category_id: 0, location: "", is_remote: 0, page: 1 } })}
              className="text-xs font-medium text-muted-foreground hover:text-foreground text-left"
            >
              Clear all filters
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSearch({ category_id: 0 })}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${!search.category_id ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}
          >All</button>
          {categories.slice(0, 12).map((c) => (
            <button
              key={c.category_id}
              onClick={() => setSearch({ category_id: c.category_id })}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${search.category_id === c.category_id ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}
            >{c.category_name}</button>
          ))}
        </div>

        <div className="mt-8">
          {isFetching ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading tasks…</div>
          ) : data && !data.ok ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">Couldn't load tasks: {data.error}</div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No tasks match those filters. <Link to="/post-task" className="text-primary font-medium">Post one</Link>.
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((t) => (
                  <TaskCard key={t.task_id ?? t.id} task={toCardData(t)} />
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
