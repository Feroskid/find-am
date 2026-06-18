import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Loader2, ChevronDown, MapPin, Clock, Globe, Plus, Map as MapIcon, List } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
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
      { name: "description", content: "Browse open tasks across Nigeria. Filter by category, location, budget and remote." },
    ],
  }),
  component: BrowseTasks,
});

function statusStyle(s: string) {
  const v = s.toLowerCase();
  if (v === "open") return "text-success";
  if (v === "assigned" || v === "in_progress" || v === "accepted") return "text-amber-600";
  if (v === "completed") return "text-success";
  if (v === "cancelled") return "text-destructive";
  return "text-muted-foreground";
}

function StatusDot({ s }: { s: string }) {
  return <span className={"inline-block h-2 w-2 rounded-full bg-current " + statusStyle(s)} />;
}

function TaskListItem({ t, active, onHover }: { t: any; active?: boolean; onHover?: () => void }) {
  const id = t.task_id ?? t.id;
  if (id == null) return null;
  const status = String(t.status ?? "open").toLowerCase();
  const offers = t.offers_count ?? t.applications_count ?? 0;
  const remote = !!t.is_remote;
  const loc = t.location_text ?? t.location;
  const date = t.deadline ? new Date(t.deadline) : null;

  return (
    <Link
      to="/tasks/$taskId"
      params={{ taskId: String(id) }}
      onMouseEnter={onHover}
      className={
        "block rounded-2xl border bg-card p-4 transition hover:border-primary hover:shadow-sm " +
        (active ? "border-primary shadow-sm" : "border-border")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-ink leading-snug line-clamp-2">{t.title ?? "Untitled task"}</h3>
        <span className="font-display text-xl text-ink shrink-0">₦{Number(t.budget ?? 0).toLocaleString()}</span>
      </div>
      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          {remote ? <Globe className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
          {remote ? "Remote" : (loc ?? "On-site")}
        </li>
        <li className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {date ? date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) : "Flexible"}
        </li>
      </ul>
      <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
        <StatusDot s={status} />
        <span className={"capitalize " + statusStyle(status)}>{status.replace("_", " ")}</span>
        <span className="text-muted-foreground">· {offers} offer{Number(offers) === 1 ? "" : "s"}</span>
      </div>
    </Link>
  );
}

function BrowseTasks() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState(search.q);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileMap, setMobileMap] = useState(false);

  const list = useServerFn(listTasks);
  const cats = useServerFn(getCategories);

  const limit = 20;
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

  const setSearch = (patch: Partial<typeof search>) =>
    navigate({ to: "/tasks/browse", search: { ...search, ...patch, page: patch.page ?? 1 } });

  const activeCat = categories.find((c) => c.category_id === search.category_id)?.category_name;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />

      {/* Sticky filter bar */}
      <div className="sticky top-[110px] z-20 bg-background border-b border-border">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 py-2.5 flex items-center gap-2 overflow-x-auto">
          <form
            onSubmit={(e) => { e.preventDefault(); setSearch({ q: query }); }}
            className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 min-w-[180px] flex-1 max-w-xs"
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a task"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
          </form>

          <button
            onClick={() => {
              const v = prompt("Filter by category id (0 for all)", String(search.category_id || ""));
              if (v != null) setSearch({ category_id: Number(v) || 0 });
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold whitespace-nowrap"
          >
            {activeCat ? activeCat : "All categories"} <ChevronDown className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setSearch({ is_remote: search.is_remote ? 0 : 1 })}
            className={
              "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap border " +
              (search.is_remote ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")
            }
          >
            Remote only <ChevronDown className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => {
              const loc = prompt("Location filter", search.location);
              if (loc != null) setSearch({ location: loc });
            }}
            className="hidden sm:inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold whitespace-nowrap"
          >
            {search.location || "Any location"} <ChevronDown className="h-3.5 w-3.5" />
          </button>

          <Link to="/post-task" className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground whitespace-nowrap">
            <Plus className="h-4 w-4" /> Post
          </Link>
        </div>
      </div>

      <main className="flex-1 mx-auto w-full max-w-7xl">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-0 lg:gap-4 lg:py-4 lg:px-4">
          {/* LIST */}
          <section className={(mobileMap ? "hidden " : "") + "lg:block px-3 sm:px-4 py-3 lg:p-0"}>
            {isFetching ? (
              <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Loading tasks…</div>
            ) : data && !data.ok ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">Couldn't load tasks: {data.error}</div>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                No tasks match those filters. <Link to="/post-task" className="text-primary font-bold">Post one</Link>.
              </div>
            ) : (
              <>
                <div className="text-xs text-muted-foreground mb-2">{rows.length} task{rows.length === 1 ? "" : "s"} found</div>
                <div className="grid gap-2">
                  {rows.map((t) => (
                    <TaskListItem
                      key={t.task_id ?? t.id}
                      t={t}
                      active={hoveredId === String(t.task_id ?? t.id)}
                      onHover={() => setHoveredId(String(t.task_id ?? t.id))}
                    />
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <button
                    disabled={search.page <= 1}
                    onClick={() => setSearch({ page: search.page - 1 })}
                    className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold disabled:opacity-40"
                  >Previous</button>
                  <span className="text-xs text-muted-foreground">Page {search.page}</span>
                  <button
                    disabled={rows.length < limit}
                    onClick={() => setSearch({ page: search.page + 1 })}
                    className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold disabled:opacity-40"
                  >Next</button>
                </div>
              </>
            )}
          </section>

          {/* MAP placeholder (we keep it lightweight; LiveTasksMap is heavy) */}
          <aside className={(mobileMap ? "" : "hidden ") + "lg:block sticky top-[170px] h-[calc(100vh-170px)] lg:h-[calc(100vh-180px)] bg-surface-soft rounded-none lg:rounded-2xl border-y lg:border border-border overflow-hidden"}>
            <div className="h-full w-full grid place-items-center text-muted-foreground bg-[radial-gradient(circle_at_50%_50%,oklch(0.95_0.02_240),oklch(0.92_0.02_240))]">
              <div className="text-center px-6">
                <MapIcon className="h-10 w-10 mx-auto text-primary" />
                <div className="mt-3 font-bold text-ink">Tasks near you</div>
                <p className="mt-1 text-xs">Open the full live map to see every task pin.</p>
                <Link to="/map" className="mt-3 inline-flex rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground">Open live map</Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile map toggle */}
      <button
        onClick={() => setMobileMap((v) => !v)}
        className="lg:hidden fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-ink text-background px-4 py-3 text-sm font-bold shadow-lg"
      >
        {mobileMap ? <><List className="h-4 w-4" /> List</> : <><MapIcon className="h-4 w-4" /> Map</>}
      </button>
    </div>
  );
}
