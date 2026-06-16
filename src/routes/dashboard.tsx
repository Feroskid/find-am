import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Loader2, Plus, MessageSquare, Bell, Wallet, Briefcase, Wrench, User,
  Search, Star, ListChecks, Banknote, MapPin,
} from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { TaskCard, toCardData } from "@/components/TaskCard";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { Footer } from "@/components/Footer";
import { TierProgress } from "@/components/TierProgress";
import { useAuth } from "@/lib/auth";
import { listTasks, unreadCount, walletBalance, getUserTasks } from "@/lib/findtask.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Find-task" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { token, user, mode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) navigate({ to: "/login", search: { redirect: "/dashboard" } as any });
  }, [token, navigate]);

  const list = useServerFn(listTasks);
  const unread = useServerFn(unreadCount);
  const wallet = useServerFn(walletBalance);
  const userTasks = useServerFn(getUserTasks);

  const myId = (user as any)?.user_id ?? (user as any)?.id;
  const isPoster = mode === "poster";

  const recentQ = useQuery({
    queryKey: ["dashboard", "recent", mode],
    enabled: !!token,
    queryFn: () => list({ data: { page: 1, limit: 6 } }),
  });
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
  const myTasksQ = useQuery({
    queryKey: ["dashboard", "my-tasks", myId, mode],
    enabled: !!token && !!myId,
    queryFn: () => userTasks({ data: { userId: String(myId) } }),
  });

  if (!token) return null;

  const displayName =
    (user as any)?.name || (user as any)?.full_name || (user as any)?.email || "there";
  const recent: any[] = extractList(recentQ.data?.ok ? recentQ.data.data : null);
  const myTasks: any[] = extractList(myTasksQ.data?.ok ? myTasksQ.data.data : null);
  const unreadN: number = unreadQ.data?.ok ? Number((unreadQ.data.data as any)?.unread_count ?? 0) : 0;
  const balance = walletQ.data?.ok
    ? (walletQ.data.data as any)?.balance ?? (walletQ.data.data as any)?.available_balance
    : null;

  // KPIs derived from myTasks (best-effort)
  const stat = (status: string) =>
    myTasks.filter((t) => String(t.status ?? "").toLowerCase() === status).length;

  const posterKpis = [
    { icon: Briefcase, label: "Posted", value: String(myTasks.length) },
    { icon: ListChecks, label: "In escrow", value: String(stat("in_progress") + stat("escrow") + stat("accepted")) },
    { icon: Star, label: "Completed", value: String(stat("completed")) },
    { icon: Banknote, label: "Wallet", value: balance != null ? `₦${Number(balance).toLocaleString()}` : "—" },
  ];
  const taskerKpis = [
    { icon: ListChecks, label: "Applied", value: String(myTasks.length) },
    { icon: Wrench, label: "Active", value: String(stat("in_progress") + stat("accepted")) },
    { icon: Star, label: "Completed", value: String(stat("completed")) },
    { icon: Wallet, label: "Earnings", value: balance != null ? `₦${Number(balance).toLocaleString()}` : "—" },
  ];
  const kpis = isPoster ? posterKpis : taskerKpis;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 flex-1">
        {/* Greeting + mode + primary CTA */}
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

        {/* KPI strip */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <Kpi key={k.label} icon={k.icon} label={k.label} value={k.value} />
          ))}
        </div>

        {/* KPI strip */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <Kpi key={k.label} icon={k.icon} label={k.label} value={k.value} />
          ))}
        </div>

        {/* Tasker tier progress */}
        {!isPoster && (
          <div className="mt-6">
            <TierProgress earnings={Number(balance ?? 0)} />
          </div>
        )}

        {/* Mode-specific main section */}
        {isPoster ? <PosterMain myTasks={myTasks} loading={myTasksQ.isFetching} /> : <TaskerMain recent={recent} loading={recentQ.isFetching} />}

        {/* Quick links */}
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
  return d.tasks ?? d.results ?? d.data ?? [];
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-xl font-bold truncate">{value}</div>
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
  return (
    <section className="mt-10 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My posted tasks</h2>
        <Link to="/post-task" className="text-sm font-medium text-primary hover:underline">+ New task</Link>
      </div>
      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>
      ) : myTasks.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          You haven't posted any tasks yet. <Link to="/post-task" className="text-primary font-medium">Post your first task →</Link>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {myTasks.slice(0, 8).map((t: any) => (
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
      )}
    </section>
  );
}

function TaskerMain({ recent, loading }: { recent: any[]; loading: boolean }) {
  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recommended tasks for you</h2>
        <Link to="/explore" className="text-sm font-medium text-primary hover:underline">Explore all →</Link>
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>
        ) : recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No open tasks right now. <Link to="/tasks/categories" className="text-primary font-medium">Browse categories</Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((t) => <TaskCard key={t.task_id ?? t.id} task={toCardData(t)} />)}
          </div>
        )}
      </div>
    </section>
  );
}
