import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Search, ScanLine, TrendingUp, Briefcase, ShieldCheck, Wallet, Star,
  ArrowRight, Sparkles, MapPin,
} from "lucide-react";
import { FindAmLogo } from "@/components/FindAmLogo";
import { LanguageMenu } from "@/components/LanguageMenu";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TaskCard, toCardData } from "@/components/TaskCard";
import { Footer } from "@/components/Footer";
import { FALLBACK_CATEGORIES } from "@/lib/findtask-categories";
import { listTasks, getCategories } from "@/lib/findtask.functions";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/track";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Find-Am — Get work done across Nigeria" },
      {
        name: "description",
        content:
          "Find-Am connects you with trusted Taskers across Nigeria. Post a task, get offers, pay safely via escrow.",
      },
    ],
  }),
  component: Home,
});

const TRENDING_POOL = [
  "Cleaning", "Plumber", "Electrician", "Delivery rider", "Graphic designer",
  "Software developer", "Tutor", "Hair stylist", "Photographer", "Mover",
  "Tailor", "Mechanic", "Catering", "Makeup artist", "Driver",
];

function pickTrending() {
  return [...TRENDING_POOL].sort(() => Math.random() - 0.5).slice(0, 8);
}

function Home() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { token } = useAuth();
  const [q, setQ] = useState("");
  const [trending, setTrending] = useState<string[]>([]);

  useEffect(() => {
    setTrending(pickTrending());
    track({ action_type: "page_view", search_query: "home" });
  }, []);

  const go = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    track({ action_type: "search", search_query: trimmed });
    navigate({ to: "/search", search: { q: trimmed, page: 1 } });
  };

  const listFn = useServerFn(listTasks);
  const recent = useQuery({
    queryKey: ["home-recent"],
    queryFn: () => listFn({ data: { page: 1, limit: 6, sort: "recent" } }),
    staleTime: 60_000,
  });
  const recentTasks: any[] = recent.data?.ok
    ? ((recent.data.data as any)?.tasks ?? (recent.data.data as any)?.results ?? [])
    : [];

  const catsFn = useServerFn(getCategories);
  const catsQ = useQuery({ queryKey: ["categories"], queryFn: () => catsFn({}), staleTime: 5 * 60_000 });
  const apiCats: any[] = catsQ.data?.ok ? ((catsQ.data.data as any)?.categories ?? []) : [];
  const featured = (apiCats.length ? apiCats.slice(0, 8) : FALLBACK_CATEGORIES.slice(0, 8).map((c, i) => ({ category_id: i + 1, category_name: c.label, _slug: c.slug }))) as any[];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-background/85 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <FindAmLogo size="text-2xl" />
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link to="/explore" className="px-3 py-1.5 rounded-full hover:bg-muted">Explore</Link>
            <Link to="/tasks/categories" className="px-3 py-1.5 rounded-full hover:bg-muted">Categories</Link>
            <Link to="/map" className="px-3 py-1.5 rounded-full hover:bg-muted">Live map</Link>
            <Link to="/community" className="px-3 py-1.5 rounded-full hover:bg-muted">Community</Link>
          </nav>
          <div className="flex items-center gap-1.5">
            <LanguageMenu />
            <ThemeToggle />
            {token ? (
              <Link to="/dashboard" className="ml-1 inline-flex items-center rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="ml-1 hidden sm:inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Login</Link>
                <Link to="/register" className="inline-flex items-center rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background border-b border-border/60">
        <div className="absolute inset-0 -z-10 opacity-50">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
        </div>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Nigeria's tasking marketplace
          </span>
          <h1 className="mt-4 text-4xl sm:text-6xl font-black tracking-tight">
            Need work done? <span className="text-primary">Find-am.</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Post a task, get offers from trusted Taskers near you, and pay safely with escrow.
            Or browse open tasks and start earning today.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); go(q); }} className="mt-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 px-4 py-3 rounded-full border border-border bg-card shadow-sm focus-within:shadow-md">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="What do you need done? (e.g. fix leaking sink in Lekki)"
                className="flex-1 bg-transparent outline-none text-base min-w-0"
              />
              <VoiceSearchButton onResult={(text) => { setQ(text); go(text); }} />
              <button type="button" aria-label="Search by image" className="p-1.5 rounded-full hover:bg-muted text-muted-foreground" onClick={() => track({ action_type: "lens_click" })}>
                <ScanLine className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {trending.map((it) => (
                <Link key={it} to="/search" search={{ q: it.toLowerCase(), page: 1 }}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card/70 px-2.5 py-1 text-xs text-foreground/80 hover:border-primary hover:text-primary">
                  <TrendingUp className="h-3 w-3" /> {it}
                </Link>
              ))}
            </div>
          </form>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/post-task" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
              <Briefcase className="h-4 w-4" /> Post a task
            </Link>
            <Link to="/explore" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted">
              Find work to do <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { k: "1M+", v: "Nigerians on Find-am" },
            { k: "120k", v: "Tasks completed" },
            { k: "₦2.4B", v: "Paid to taskers" },
            { k: "4.8★", v: "Average rating" },
          ].map((s) => (
            <div key={s.v}>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-primary">{s.k}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">How Find-task works</h2>
        <p className="mt-2 text-center text-muted-foreground">Three simple steps. Zero stress.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { n: 1, icon: Briefcase, t: "Post your task", d: "Describe what you need and set a budget. Free to post — pay only when work is done." },
            { n: 2, icon: Star, t: "Choose a Tasker", d: "Review offers, ratings and past work. Chat securely on-platform before you accept." },
            { n: 3, icon: ShieldCheck, t: "Pay safely via escrow", d: "Funds are held in escrow and only released when you confirm the work is complete." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <s.icon className="h-7 w-7 text-primary" />
                <span className="text-5xl font-black text-muted/30">{s.n}</span>
              </div>
              <h3 className="mt-3 font-semibold text-lg">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured categories */}
      <section className="bg-muted/30 border-y border-border/60 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Browse popular categories</h2>
              <p className="mt-1 text-muted-foreground">From cleaning to coding — find help for almost anything.</p>
            </div>
            <Link to="/tasks/categories" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              All categories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((c: any, i: number) => {
              const meta = FALLBACK_CATEGORIES[i % FALLBACK_CATEGORIES.length];
              const Icon = meta.icon;
              return (
                <Link
                  key={c.category_id ?? i}
                  to="/tasks/browse"
                  search={{ q: "", category_id: c.category_id ?? 0, location: "", is_remote: 0, page: 1 }}
                  className="group rounded-2xl border border-border bg-card p-5 hover:border-primary hover:shadow-md transition-all"
                >
                  <Icon className="h-7 w-7 text-primary" />
                  <div className="mt-3 font-semibold">{c.category_name ?? meta.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1 group-hover:text-primary">
                    Browse tasks <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent tasks */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Fresh tasks near you</h2>
            <p className="mt-1 text-muted-foreground">Newly posted by people who need help today.</p>
          </div>
          <Link to="/explore" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recent.isFetching && recentTasks.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 rounded-2xl border border-border bg-card animate-pulse" />
              ))
            : recentTasks.length === 0
              ? <div className="text-sm text-muted-foreground">No tasks yet. Be the first to <Link to="/post-task" className="text-primary underline">post one</Link>.</div>
              : recentTasks.slice(0, 6).map((t: any) => (
                  <TaskCard key={t.task_id ?? t.id} task={toCardData(t)} />
                ))}
        </div>
      </section>

      {/* Trust */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-background border-t border-border/60 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 grid md:grid-cols-3 gap-6">
          {[
            { icon: ShieldCheck, t: "Escrow-protected payments", d: "We hold the money safely until the task is done. You're never out of pocket." },
            { icon: Wallet, t: "Direct to your wallet", d: "Taskers withdraw to any Nigerian bank in minutes." },
            { icon: MapPin, t: "Real Nigerians, real reviews", d: "Every Tasker has a public profile, ratings and completed task history." },
          ].map((b) => (
            <div key={b.t} className="rounded-2xl border border-border bg-card p-6">
              <b.icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 font-semibold">{b.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16 text-center">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Ready to get something done?</h2>
        <p className="mt-3 text-muted-foreground">Join a million Nigerians using Find-am every month.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/post-task" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Post a task — it's free
          </Link>
          <Link to="/register" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted">
            Become a Tasker
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">{t.tagline}</p>
      </section>

      <Footer />
    </div>
  );
}
