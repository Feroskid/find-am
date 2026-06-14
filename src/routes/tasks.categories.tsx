import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, Search, FolderTree, ArrowRight } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { Footer } from "@/components/Footer";
import { getCategories } from "@/lib/findtask.functions";
import { FALLBACK_CATEGORIES, type CategoryItem } from "@/lib/findtask-categories";
import { Briefcase } from "lucide-react";

interface Subcat { category_id: number; category_name: string }
interface Cat { category_id: number; category_name: string; subcategories?: Subcat[] }

export const Route = createFileRoute("/tasks/categories")({
  head: () => ({
    meta: [
      { title: "All task categories — Find-task" },
      { name: "description", content: "Browse every Find-task category — cleaning, delivery, repairs, design, tech and more. Find the exact help you need." },
    ],
  }),
  component: CategoriesPage,
});

function iconFor(name: string): CategoryItem["icon"] {
  const n = name.toLowerCase();
  const hit = FALLBACK_CATEGORIES.find((c) => n.includes(c.label.toLowerCase().split(" ")[0]) || c.label.toLowerCase().includes(n.split(" ")[0]));
  return hit?.icon ?? Briefcase;
}

function CategoriesPage() {
  const fn = useServerFn(getCategories);
  const { data, isFetching } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fn({}),
    staleTime: 5 * 60_000,
  });
  const categories: Cat[] = data?.ok ? (data.data as any)?.categories ?? [] : [];
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return categories;
    return categories
      .map((c) => {
        const subs = (c.subcategories ?? []).filter((s) => s.category_name.toLowerCase().includes(term));
        const matches = c.category_name.toLowerCase().includes(term) || subs.length > 0;
        return matches ? { ...c, subcategories: c.category_name.toLowerCase().includes(term) ? c.subcategories : subs } : null;
      })
      .filter(Boolean) as Cat[];
  }, [categories, q]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
              <FolderTree className="h-3.5 w-3.5" /> All categories
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">
              Browse tasks by category
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Every category and sub-category on Find-task — explore to find exactly the kind of work you need done or want to do.
            </p>

            <div className="mt-6 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search categories…"
                className="w-full rounded-full border border-border bg-card pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-10">
          {isFetching ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading categories…</div>
          ) : data && !data.ok ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{data.error}</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              No categories match "{q}". Try a different search.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => {
                const Icon = iconFor(c.category_name);
                const subs = c.subcategories ?? [];
                return (
                  <article key={c.category_id} className="group rounded-2xl border border-border bg-card p-5 hover:shadow-md hover:border-primary/50 transition">
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/tasks/browse"
                          search={{ q: "", category_id: c.category_id, location: "", is_remote: 0, page: 1 }}
                          className="block font-semibold text-base hover:text-primary"
                        >
                          {c.category_name}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {subs.length > 0 ? `${subs.length} sub-categor${subs.length === 1 ? "y" : "ies"}` : "Browse tasks"}
                        </div>
                      </div>
                    </div>

                    {subs.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-1.5">
                        {subs.slice(0, 10).map((s) => (
                          <li key={s.category_id}>
                            <Link
                              to="/tasks/browse"
                              search={{ q: "", category_id: s.category_id, location: "", is_remote: 0, page: 1 }}
                              className="inline-block rounded-full border border-border px-2.5 py-1 text-xs text-foreground/80 hover:border-primary hover:text-primary hover:bg-primary/5"
                            >
                              {s.category_name}
                            </Link>
                          </li>
                        ))}
                        {subs.length > 10 && (
                          <li className="text-xs text-muted-foreground self-center">+{subs.length - 10} more</li>
                        )}
                      </ul>
                    )}

                    <Link
                      to="/tasks/browse"
                      search={{ q: "", category_id: c.category_id, location: "", is_remote: 0, page: 1 }}
                      className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all"
                    >
                      View all tasks <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </article>
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
