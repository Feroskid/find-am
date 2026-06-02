import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { getCategories } from "@/lib/findtask.functions";

interface Subcat { category_id: number; category_name: string }
interface Cat { category_id: number; category_name: string; subcategories?: Subcat[] }

export const Route = createFileRoute("/tasks/categories")({
  head: () => ({
    meta: [
      { title: "Task categories — Find-task" },
      { name: "description", content: "Explore every task category on Find-task — from cleaning and delivery to tech and design." },
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
  const categories: Cat[] = data?.ok ? (data.data as any)?.categories ?? [] : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-10 flex-1">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">All categories</h1>
        <p className="mt-2 text-muted-foreground">Pick a category to browse tasks or post your own.</p>

        {isFetching ? (
          <div className="mt-10 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : data && !data.ok ? (
          <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{data.error}</div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <section key={c.category_id} className="rounded-2xl border border-border bg-card p-5">
                <Link
                  to="/tasks/browse"
                  search={{ q: "", category_id: c.category_id, location: "", is_remote: 0, page: 1 }}
                  className="text-lg font-semibold hover:text-primary"
                >
                  {c.category_name}
                </Link>
                {c.subcategories && c.subcategories.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {c.subcategories.map((s) => (
                      <li key={s.category_id}>
                        <Link
                          to="/tasks/browse"
                          search={{ q: "", category_id: s.category_id, location: "", is_remote: 0, page: 1 }}
                          className="inline-block rounded-full border border-border px-2.5 py-1 text-xs text-foreground/80 hover:border-primary hover:text-primary"
                        >
                          {s.category_name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
