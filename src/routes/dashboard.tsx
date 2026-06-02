import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2, Plus, MessageSquare, Bell, Wallet, Briefcase } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { TaskCard, toCardData } from "@/components/TaskCard";
import { useAuth } from "@/lib/auth";
import { listTasks, unreadCount, walletBalance } from "@/lib/findtask.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Find-task" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) navigate({ to: "/login", search: { redirect: "/dashboard" } as any });
  }, [token, navigate]);

  const list = useServerFn(listTasks);
  const unread = useServerFn(unreadCount);
  const wallet = useServerFn(walletBalance);

  const recentQ = useQuery({
    queryKey: ["dashboard", "recent"],
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

  if (!token) return null;

  const displayName =
    (user as any)?.name || (user as any)?.full_name || (user as any)?.email || "there";
  const recent: any[] = recentQ.data?.ok
    ? ((recentQ.data.data as any)?.results ?? [])
    : [];
  const unreadN: number = unreadQ.data?.ok
    ? Number((unreadQ.data.data as any)?.unread_count ?? 0)
    : 0;
  const balance = walletQ.data?.ok
    ? (walletQ.data.data as any)?.balance ?? (walletQ.data.data as any)?.available_balance
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {displayName}</h1>
            <p className="mt-1 text-muted-foreground">Manage your tasks and applications.</p>
          </div>
          <Link to="/post-task" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Post a task
          </Link>
        </div>

        {/* Stat cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={Bell}
            label="Unread notifications"
            value={String(unreadN)}
            href="/notifications"
          />
          <StatCard
            icon={Wallet}
            label="Wallet balance"
            value={balance != null ? `₦${Number(balance).toLocaleString()}` : "—"}
            href="/dashboard"
          />
          <StatCard
            icon={Briefcase}
            label="Browse open tasks"
            value="Explore"
            href="/tasks/browse"
          />
        </div>

        {/* Recent tasks */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent open tasks</h2>
            <Link to="/tasks/browse" className="text-sm font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-4">
            {recentQ.isFetching ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>
            ) : recent.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                No tasks yet. <Link to="/post-task" className="text-primary font-medium">Post your first task</Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((t) => <TaskCard key={t.task_id ?? t.id} task={toCardData(t)} />)}
              </div>
            )}
          </div>
        </section>

        {/* Account */}
        <section className="mt-10 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Account</h2>
            <Link to="/messages" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
              <MessageSquare className="h-4 w-4" /> Messages
            </Link>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {Object.entries((user ?? {}) as Record<string, unknown>).map(([k, v]) => (
              <div key={k} className="border-b border-border/60 pb-2">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k.replace(/_/g, " ")}</dt>
                <dd className="font-medium break-all">{String(v ?? "—")}</dd>
              </div>
            ))}
          </dl>
          <button onClick={logout} className="mt-6 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            Log out
          </button>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, href,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; href: string }) {
  return (
    <Link
      to={href as any}
      className="rounded-2xl border border-border bg-card p-5 hover:border-primary hover:shadow-md transition-all flex items-center gap-4"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-lg font-bold truncate">{value}</div>
      </div>
    </Link>
  );
}
