import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, Search, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { Footer } from "@/components/Footer";
import { FALLBACK_CATEGORIES } from "@/lib/findtask-categories";
import { getCategories } from "@/lib/findtask.functions";

interface Subcat { category_id: number; category_name: string }
interface Cat { category_id: number; category_name: string; subcategories?: Subcat[] }

export const Route = createFileRoute("/tasks/categories")({
  head: () => ({
    meta: [
      { title: "All task categories — Find-task" },
      { name: "description", content: "Explore every task category on Find-task — from cleaning and delivery to design, tech and tutoring." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const fn = useServerFn(getCategories);
  const { data, isFetching } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fn({}),
    staleTime: 5 * 60_000,
  });
  const categories: Cat[] = data?.ok ? ((data.data as any)?.categories ?? []) : [];

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories
      .map((c) => {
        const subMatch = (c.subcategories ?? []).filter((s) => s.category_name.toLowerCase().includes(q));
        if (c.category_name.toLowerCase().includes(q)) return c;
        if (subMatch.length) return { ...c, subcategories: subMatch };
        return null;
      })
      .filter(Boolean) as Cat[];
  }, [categories, search]);

  const popular = (categories.length ? categories.slice(0, 6) : FALLBACK_CATEGORIES.slice(0, 6).map((c, i) => ({ category_id: i + 1, category_name: c.label }))) as Cat[];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border/60">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">All task categories</h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">Find the exact help you need. Pick a category to browse open tasks or post your own.</p>
            <div className="mt-6 max-w-xl flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories (e.g. plumbing, tutor, design)"
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Popular right now</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {popular.map((c, i) => {
              const meta = FALLBACK_CATEGORIES[i % FALLBACK_CATEGORIES.length];
              const Icon = meta.icon;
              return (
                <Link
                  key={c.category_id}
                  to="/tasks/browse"
                  search={{ q: "", category_id: c.category_id, location: "", is_remote: 0, page: 1 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm hover:border-primary hover:text-primary"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" /> {c.category_name}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
          {isFetching ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading categories…</div>
          ) : data && !data.ok ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{data.error}</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">No categories matched "{search}".</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((c, i) => {
                const meta = FALLBACK_CATEGORIES[i % FALLBACK_CATEGORIES.length];
                const Icon = meta.icon;
                const isOpen = open[c.category_id] ?? !!search.trim();
                const subs = c.subcategories ?? [];
                return (
                  <section key={c.category_id} className="rounded-2xl border border-border bg-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpen((o) => ({ ...o, [c.category_id]: !isOpen }))}
                      className="w-full flex items-center gap-3 p-5 text-left hover:bg-muted/40"
                    >
                      <span className="grid place-items-center h-10 w-10 rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{c.category_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {subs.length ? `${subs.length} subcategories` : "Tap to browse"}
                        </div>
                      </div>
                      <Link
                        to="/tasks/browse"
                        search={{ q: "", category_id: c.category_id, location: "", is_remote: 0, page: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="hidden sm:inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
                      >
                        Browse <ArrowRight className="h-3 w-3" />
                      </Link>
                      {subs.length > 0 && (isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />)}
                    </button>
                    {isOpen && subs.length > 0 && (
                      <div className="px-5 pb-5 -mt-1">
                        <div className="flex flex-wrap gap-1.5">
                          {subs.map((s) => (
                            <Link
                              key={s.category_id}
                              to="/tasks/browse"
                              search={{ q: "", category_id: s.category_id, location: "", is_remote: 0, page: 1 }}
                              className="inline-block rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground/80 hover:border-primary hover:text-primary"
                            >
                              {s.category_name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
