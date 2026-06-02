import { createFileRoute, Link } from "@tanstack/react-router";
import { TaskHeader } from "@/components/TaskHeader";
import { FALLBACK_CATEGORIES } from "@/lib/findtask-categories";

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
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-10 flex-1">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">All categories</h1>
        <p className="mt-2 text-muted-foreground">Pick a category to browse tasks or post your own.</p>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {FALLBACK_CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to="/tasks/browse"
              search={{ q: "", category: c.slug }}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary hover:shadow-md transition-all"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold">{c.label}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
