import { createFileRoute, Link } from "@tanstack/react-router";
import { TaskHeader } from "@/components/TaskHeader";
import { Footer } from "@/components/Footer";
import { Clock, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/coming-soon")({
  head: () => ({
    meta: [
      { title: "Coming soon — Find-task" },
      { name: "description", content: "This feature is coming soon to Find-task." },
    ],
  }),
  component: ComingSoonPage,
});

function ComingSoonPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TaskHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
            <Clock className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">Coming soon</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We&apos;re building something great. Check back shortly — this page will be live very soon.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              <ArrowLeft className="h-4 w-4" /> Go home
            </Link>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-bold text-ink hover:bg-accent"
            >
              Browse tasks
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
