import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2, Plus, MessageSquare, Bell, Wallet, Briefcase, Wrench, User,
  Search, Star, ListChecks, Banknote, MapPin, ChevronLeft, ChevronRight,
} from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { TaskCard, toCardData } from "@/components/TaskCard";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { Footer } from "@/components/Footer";
import { TierProgress } from "@/components/TierProgress";
import { useAuth } from "@/lib/auth";
import {
  listTasks, unreadCount, walletBalance, walletTransactions, getUserTasks,
} from "@/lib/findtask.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Find-task" }] }),
  component: Dashboard,
});

const PAGE_SIZE = 6;

function Dashboard() {
  const { token, ready, user, mode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !token) navigate({ to: "/login", search: { redirect: "/dashboard" } as any });
  }, [token, ready, navigate]);

  const unread = useServerFn(unreadCount);
  const wallet = useServerFn(walletBalance);
  const txs = useServerFn(walletTransactions);
  const userTasks = useServerFn(getUserTasks);

  const myId = (user as any)?.user_id ?? (user as any)?.id;
  const isPoster = mode === "poster";

  const unreadQ = useQuery({
    queryKey: ["dashboard", "unread", token],
    enabled: !!token,
    queryFn: () => unread({ data: { token: token! } }),
    refetchInterval: 60_000,
  });
  const walletQ = useQuery({
    queryKey: ["dashboard", "wallet", token],
    enabled: !!token,
    queryFn: () => wallet({ data: { token: token! } }),
  });
  const txQ = useQuery({
    queryKey: ["dashboard", "tx", token],
    enabled: !!token && !isPoster,
    queryFn: () => txs({ data: { token: token! } }),
  });
  const myTasksQ = useQuery({
    queryKey: ["dashboard", "my-tasks", myId, mode],
    enabled: !!token && !!myId,
    queryFn: () => userTasks({ data: { userId: String(myId), token, role: isPoster ? "poster" : "tasker" } }),
  });


  if (!token) return null;

  const displayName =
    (user as any)?.name || (user as any)?.full_name || (user as any)?.email || "there";
  const myTasks: any[] = extractList(myTasksQ.data?.ok ? myTasksQ.data.data : null);
  const unreadN: number = unreadQ.data?.ok ? Number((unreadQ.data.data as any)?.unread_count ?? 0) : 0;
  const balance = walletQ.data?.ok
    ? (walletQ.data.data as any)?.balance ?? (walletQ.data.data as any)?.available_balance
    : null;

  const earnings30d = useMemo(() => {
    const list: any[] = extractList(txQ.data?.ok ? txQ.data.data : null);
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return list
      .filter((t) => {
        const ts = new Date(t.created_at ?? t.date ?? 0).getTime();
        const type = String(t.type ?? t.direction ?? "").toLowerCase();
        const amt = Number(t.amount ?? 0);
        return ts >= cutoff && (type === "credit" || type === "earning" || amt > 0);
      })
      .reduce((s, t) => s + Number(t.amount ?? 0), 0);
  }, [txQ.data]);

  const stat = (status: string) =>
    myTasks.filter((t) => String(t.status ?? "").toLowerCase() === status).length;

  const rating = (user as any)?.rating ?? (user as any)?.average_rating ?? "—";

  const posterKpis = [
    { icon: Briefcase, label: "Posted", value: String(myTasks.length), sub: "all-time" },
    { icon: ListChecks, label: "In escrow", value: String(stat("in_progress") + stat("escrow") + stat("accepted")), sub: "active" },
    { icon: Star, label: "Completed", value: String(stat("completed")), sub: "lifetime" },
    { icon: Banknote, label: "Wallet", value: balance != null ? `₦${Number(balance).toLocaleString()}` : "—", sub: "available" },
  ];
  const taskerKpis = [
    { icon: Wrench, label: "Active", value: String(stat("in_progress") + stat("accepted")), sub: "in progress" },
    { icon: Star, label: "Completed", value: String(stat("completed")), sub: "lifetime" },
    { icon: User, label: "Rating", value: typeof rating === "number" ? rating.toFixed(1) : String(rating), sub: "average" },
    { icon: Wallet, label: "Earnings", value: `₦${Number(earnings30d ?? 0).toLocaleString()}`, sub: "last 30 days" },
  ];
  const kpis = isPoster ? posterKpis : taskerKpis;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-ink">Welcome back, {displayName}</h1>
            <p className="mt-1 text-muted-foreground inline-flex items-center gap-2">
              You're in <span className="font-semibold text-foreground inline-flex items-center gap-1">
                {isPoster ? <><Briefcase className="h-4 w-4" /> Poster</> : <><Wrench className="h-4 w-4" /> Tasker</>}
              </span> mode.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ModeSwitcher />
            {isPoster ? (
              <Link to="/post-task" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                <Plus className="h-4 w-4" /> Post a task
              </Link>
            ) : (
              <Link to="/explore" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                <Search className="h-4 w-4" /> Apply to tasks
              </Link>
            )}
            <Link to="/notifications" className="relative inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
              <Bell className="h-4 w-4" /> Inbox
              {unreadN > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unreadN}</span>
              )}
            </Link>
          </div>
        </div>

        {/* KPI strip — Airtasker style */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <Kpi key={k.label} icon={k.icon} label={k.label} value={k.value} sub={k.sub} />
          ))}
        </div>

        {!isPoster && (
          <div className="mt-6">
            <TierProgress earnings={Number(earnings30d ?? 0)} />
          </div>
        )}

        {isPoster
          ? <PosterMain myTasks={myTasks} loading={myTasksQ.isFetching} />
          : <TaskerMain />}

        <section className="mt-10 grid gap-3 sm:grid-cols-3">
          <QuickLink to="/wallet" icon={Wallet} title="Wallet & escrow" desc="Top up, withdraw, and track payments" />
          <QuickLink to="/messages" icon={MessageSquare} title="Messages" desc="Chat with posters & taskers (E2E encrypted)" />
          <QuickLink to="/profile" icon={User} title="Profile" desc="Update your photo, bio and categories" />
        </section>
      </main>
      <Footer />
    </div>
  );
}

function extractList(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return (
    d.tasks ?? d.results ?? d.transactions ?? d.items ?? d.data ??
    d.posted_tasks ?? d.user_tasks ?? d.my_tasks ?? []
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl border border-border bg-surface-soft p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-3xl text-ink truncate">{value}</div>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
          {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, title, desc }: { to: string; icon: any; title: string; desc: string }) {
  return (
    <Link to={to as any} className="rounded-2xl border border-border bg-card p-5 hover:border-primary hover:shadow-md transition">
      <div className="flex items-center gap-2 font-semibold">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
    </Link>
  );
}

function PosterMain({ myTasks, loading }: { myTasks: any[]; loading: boolean }) {
  const [page, setPage] = useState(1);
  const total = myTasks.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const slice = myTasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="mt-10 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My posted tasks</h2>
        <Link to="/post-task" className="text-sm font-medium text-primary hover:underline">+ New task</Link>
      </div>
      {loading ? (
        <SkeletonRows />
      ) : total === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          You haven't posted any tasks yet. <Link to="/post-task" className="text-primary font-medium">Post your first task →</Link>
        </div>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-border">
            {slice.map((t: any) => (
              <li key={t.task_id ?? t.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link to="/tasks/$taskId" params={{ taskId: String(t.task_id ?? t.id) }} className="font-medium hover:text-primary truncate block">
                    {t.title ?? "Untitled"}
                  </Link>
                  <div className="text-xs text-muted-foreground inline-flex items-center gap-2 mt-0.5">
                    {(t.location_text ?? t.location) && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{t.location_text ?? t.location}</span>}
                    <span>₦{Number(t.budget ?? 0).toLocaleString()}</span>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary capitalize">{String(t.status ?? "open")}</span>
              </li>
            ))}
          </ul>
          <Pager page={page} pages={pages} onChange={setPage} />
        </>
      )}
    </section>
  );
}

function TaskerMain() {
  const [page, setPage] = useState(1);
  const list = useServerFn(listTasks);
  const q = useQuery({
    queryKey: ["dashboard", "recommended", page],
    queryFn: () => list({ data: { page, limit: PAGE_SIZE } }),
    placeholderData: keepPreviousData,
  });

  const items: any[] = extractList(q.data?.ok ? q.data.data : null);
  const total = q.data?.ok ? Number((q.data.data as any)?.total ?? items.length) : items.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isLoading = q.isLoading;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recommended tasks for you</h2>
        <Link to="/explore" className="text-sm font-medium text-primary hover:underline">Explore all →</Link>
      </div>
      <div className="mt-4">
        {isLoading ? (
          <SkeletonGrid />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No open tasks right now. <Link to="/tasks/categories" className="text-primary font-medium">Browse categories</Link>
          </div>
        ) : (
          <>
            <div className={"grid gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-opacity " + (q.isFetching ? "opacity-60" : "")}>
              {items.map((t) => <TaskCard key={t.task_id ?? t.id} task={toCardData(t)} />)}
            </div>
            <Pager page={page} pages={pages} onChange={setPage} />
          </>
        )}
      </div>
    </section>
  );
}

function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-3 text-sm">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 font-medium hover:bg-muted disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" /> Prev
      </button>
      <span className="text-muted-foreground">Page <span className="font-semibold text-foreground">{page}</span> of {pages}</span>
      <button
        onClick={() => onChange(Math.min(pages, page + 1))}
        disabled={page >= pages}
        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 font-medium hover:bg-muted disabled:opacity-40"
      >
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function SkeletonRows() {
  return (
    <ul className="mt-4 divide-y divide-border">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <li key={i} className="py-3 flex items-center justify-between gap-3 animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-3 w-1/3 rounded bg-muted" />
          </div>
          <div className="h-5 w-16 rounded-full bg-muted" />
        </li>
      ))}
    </ul>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5 h-40 animate-pulse">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="mt-3 h-3 w-1/2 rounded bg-muted" />
          <div className="mt-6 h-3 w-3/4 rounded bg-muted" />
          <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

/* legacy export retained for any external import — also used during loading */
function _Loader() { return <Loader2 className="h-4 w-4 animate-spin" />; }
void _Loader;
