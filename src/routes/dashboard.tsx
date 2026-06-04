import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2, Plus, MessageSquare, Bell, Wallet, Briefcase, Wrench, User } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { TaskCard, toCardData } from "@/components/TaskCard";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { useAuth } from "@/lib/auth";
import { listTasks, unreadCount, walletBalance } from "@/lib/findtask.functions";

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

  if (!token) return null;

  const displayName =
    (user as any)?.name || (user as any)?.full_name || (user as any)?.email || "there";
  const recent: any[] = (() => {
    if (!recentQ.data?.ok) return [];
    const d: any = recentQ.data.data;
    return d?.results ?? d?.tasks ?? (Array.isArray(d) ? d : []);
  })();
  const unreadN: number = unreadQ.data?.ok
    ? Number((unreadQ.data.data as any)?.unread_count ?? 0)
    : 0;
  const balance = walletQ.data?.ok
    ? (walletQ.data.data as any)?.balance ?? (walletQ.data.data as any)?.available_balance
    : null;

  const isPoster = mode === "poster";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {displayName}</h1>
            <p className="mt-1 text-muted-foreground inline-flex items-center gap-2">
              You're in <span className="font-semibold text-foreground inline-flex items-center gap-1">
                {isPoster ? <><Briefcase className="h-4 w-4" /> Poster</> : <><Wrench className="h-4 w-4" /> Tasker</>}
              </span> mode.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ModeSwitcher />
            <Link to="/post-task" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> Post a task
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <StatCard icon={Bell} label="Notifications" value={String(unreadN)} href="/notifications" />
          <StatCard icon={Wallet} label="Wallet" value={balance != null ? `₦${Number(balance).toLocaleString()}` : "—"} href="/wallet" />
          <StatCard icon={Briefcase} label={isPoster ? "Post a task" : "Find work"} value={isPoster ? "Create" : "Browse"} href={isPoster ? "/post-task" : "/tasks/browse"} />
          <StatCard icon={User} label="Profile" value="View" href="/profile" />
        </div>

        {/* Mode-specific content */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {isPoster ? "Recent tasks you can manage" : "Open tasks to apply for"}
            </h2>
            <Link to="/tasks/browse" className="text-sm font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-4">
            {recentQ.isFetching ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>
            ) : recent.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                {isPoster ? (
                  <>No tasks yet. <Link to="/post-task" className="text-primary font-medium">Post your first task</Link></>
                ) : (
                  <>No open tasks right now. <Link to="/tasks/categories" className="text-primary font-medium">Browse categories</Link></>
                )}
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
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold">Account</h2>
            <div className="flex items-center gap-3 text-sm">
              <Link to="/profile" className="text-primary font-medium inline-flex items-center gap-1"><User className="h-4 w-4" /> Profile</Link>
              <Link to="/messages" className="text-primary font-medium inline-flex items-center gap-1"><MessageSquare className="h-4 w-4" /> Messages</Link>
              <Link to="/wallet" className="text-primary font-medium inline-flex items-center gap-1"><Wallet className="h-4 w-4" /> Wallet</Link>
            </div>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {Object.entries((user ?? {}) as Record<string, unknown>).slice(0, 8).map(([k, v]) => (
              <div key={k} className="border-b border-border/60 pb-2">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k.replace(/_/g, " ")}</dt>
                <dd className="font-medium break-all">{String(v ?? "—")}</dd>
              </div>
            ))}
          </dl>
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
