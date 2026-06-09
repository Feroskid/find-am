import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Compass, TrendingUp, MapPin, Tag, Loader2, ArrowRight } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { TaskCard, toCardData } from "@/components/TaskCard";
import { listTasks, getCategories } from "@/lib/findtask.functions";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore tasks — Find-task" },
      { name: "description", content: "Discover trending tasks, top categories, and remote opportunities across Nigeria." },
    ],
  }),
  component: ExplorePage,
});

const POPULAR_LOCATIONS = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu"];

function extractTasks(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.tasks ?? d.results ?? d.data ?? [];
}

function ExplorePage() {
  const list = useServerFn(listTasks);
  const cats = useServerFn(getCategories);

  const trendingQ = useQuery({ queryKey: ["explore", "trending"], queryFn: () => list({ data: { page: 1, limit: 8 } }) });
  const remoteQ = useQuery({ queryKey: ["explore", "remote"], queryFn: () => list({ data: { page: 1, limit: 6, is_remote: 1 } }) });
  const catsQ = useQuery({ queryKey: ["categories"], queryFn: () => cats({}), staleTime: 5 * 60_000 });

  const trending = trendingQ.data?.ok ? extractTasks(trendingQ.data.data) : [];
  const remote = remoteQ.data?.ok ? extractTasks(remoteQ.data.data) : [];
  const categories: any[] = catsQ.data?.ok ? ((catsQ.data.data as any)?.categories ?? []) : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
              <Compass className="h-3.5 w-3.5" /> Explore Find-task
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
              Discover work happening right now
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Browse trending tasks, hot categories and remote gigs across Nigeria — all in one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/tasks/browse" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Browse all tasks <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/post-task" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-muted">
                Post your own task
              </Link>
            </div>
          </div>
        </section>

        {/* Trending tasks */}
        <Section
          title="Trending right now"
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          right={<Link to="/tasks/browse" className="text-sm text-primary hover:underline">See all →</Link>}
        >
          {trendingQ.isLoading ? (
            <Loading />
          ) : trending.length === 0 ? (
            <Empty text="No tasks yet — be the first to post one." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trending.slice(0, 6).map((t: any, i: number) => <TaskCard key={i} task={toCardData(t)} />)}
            </div>
          )}
        </Section>

        {/* Popular categories */}
        <Section title="Popular categories" icon={<Tag className="h-5 w-5 text-primary" />}>
          {catsQ.isLoading ? (
            <Loading />
          ) : categories.length === 0 ? (
            <Empty text="Categories coming soon." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.slice(0, 12).map((c: any) => (
                <Link
                  key={c.category_id}
                  to="/tasks/browse"
                  search={{ category_id: c.category_id } as any}
                  className="group rounded-xl border border-border bg-card p-4 hover:border-primary/60 hover:shadow-md transition"
                >
                  <div className="font-semibold group-hover:text-primary">{c.category_name}</div>
                  {c.subcategories?.length ? (
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {c.subcategories.slice(0, 4).map((s: any) => s.category_name).join(" · ")}
                    </div>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </Section>

        {/* Popular locations */}
        <Section title="Browse by location" icon={<MapPin className="h-5 w-5 text-primary" />}>
          <div className="flex flex-wrap gap-2">
            {POPULAR_LOCATIONS.map((loc) => (
              <Link
                key={loc}
                to="/tasks/browse"
                search={{ location: loc } as any}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-muted hover:border-primary/60"
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {loc}
              </Link>
            ))}
          </div>
        </Section>

        {/* Remote */}
        <Section
          title="Remote tasks"
          icon={<Compass className="h-5 w-5 text-primary" />}
          right={<Link to="/tasks/browse" search={{ is_remote: 1 } as any} className="text-sm text-primary hover:underline">See all →</Link>}
        >
          {remoteQ.isLoading ? (
            <Loading />
          ) : remote.length === 0 ? (
            <Empty text="No remote tasks yet." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {remote.slice(0, 6).map((t: any, i: number) => <TaskCard key={i} task={toCardData(t)} />)}
            </div>
          )}
        </Section>
      </main>
    </div>
  );
}

function Section({ title, icon, right, children }: { title: string; icon: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight inline-flex items-center gap-2">{icon}{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
function Loading() {
  return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
}
function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">{text}</div>;
}
