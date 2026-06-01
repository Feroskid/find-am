import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Users, Star, Sparkles, Hammer, Truck, Brush, Wrench, Laptop, ClipboardList } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Find-task — Get anything done across Nigeria" },
      { name: "description", content: "Post any task. Pick the best person. Get it done. Find-task connects you with trusted Taskers nationwide." },
      { property: "og:title", content: "Find-task — Get anything done" },
      { property: "og:description", content: "Post any task. Pick the best person. Get it done." },
    ],
  }),
  component: TasksHome,
});

const CATEGORIES = [
  { icon: Hammer, label: "Handyman" },
  { icon: Truck, label: "Removals" },
  { icon: Brush, label: "Cleaning" },
  { icon: Wrench, label: "Repairs" },
  { icon: Laptop, label: "Tech & IT" },
  { icon: ClipboardList, label: "Admin" },
];

const STEPS = [
  { n: "1", title: "Describe your task", body: "Tell us what you need done, when and where it works for you." },
  { n: "2", title: "Choose the best Tasker", body: "Browse profiles, reviews and quotes — pick who feels right." },
  { n: "3", title: "Get it done", body: "Pay securely through Find-task only when you're happy." },
];

function TasksHome() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TaskHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[oklch(0.18_0.08_265)] text-white">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,oklch(0.55_0.25_265)_0%,transparent_45%),radial-gradient(circle_at_80%_30%,oklch(0.75_0.2_140)_0%,transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Trusted across Nigeria
          </span>
          <h1 className="mt-6 text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[0.95]">
            GET ANYTHING <br />
            <span className="text-[oklch(0.88_0.18_140)]">DONE</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-white/80">
            Post any task. Pick the best person. Get it done — safely paid through Find-task.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90"
            >
              Post your task for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/register"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/20"
            >
              Earn money as a Tasker
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 max-w-xl mx-auto gap-3 text-xs sm:text-sm text-white/80">
            <div className="flex flex-col items-center gap-1"><Users className="h-4 w-4" /><span>1M+ customers</span></div>
            <div className="flex flex-col items-center gap-1"><ShieldCheck className="h-4 w-4" /><span>Secure payments</span></div>
            <div className="flex flex-col items-center gap-1"><Star className="h-4 w-4" /><span>4.0 ‘Great’</span></div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Popular categories</h2>
        <p className="mt-2 text-muted-foreground">Whatever you need, there's a Tasker for that.</p>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-5 text-center transition-all hover:border-primary hover:shadow-md"
            >
              <c.icon className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-muted/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How Find-task works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl bg-card border border-border p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {s.n}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[oklch(0.92_0.15_140)] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-[oklch(0.25_0.15_265)]">Find-task Membership</p>
            <h3 className="mt-1 text-3xl sm:text-4xl font-black text-[oklch(0.15_0.08_265)] max-w-lg leading-tight">
              Unlock zero connection fees all year round.
            </h3>
          </div>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.25_0.15_265)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Join now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Find-task. All rights reserved.
      </footer>
    </div>
  );
}
