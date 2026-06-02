import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, ClipboardList, Briefcase, User } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { TaskCard, type TaskCardData } from "@/components/TaskCard";
import { useAuth } from "@/lib/auth";
import { myTasks, myApplications } from "@/lib/findtask.functions";

type Tab = "posted" | "applications" | "profile";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Find-task" }] }),
  component: Dashboard,
});

function extractList(d: any): TaskCardData[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.tasks)) return d.tasks;
  if (Array.isArray(d?.applications)) return d.applications;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.results)) return d.results;
  return [];
}

function Dashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("posted");

  useEffect(() => {
    if (!token) navigate({ to: "/login", search: { redirect: "/dashboard" } as any });
  }, [token, navigate]);

  const posted = useServerFn(myTasks);
  const apps = useServerFn(myApplications);

  const postedQ = useQuery({
    queryKey: ["dashboard", "posted", token],
    enabled: !!token && tab === "posted",
    queryFn: () => posted({ data: { token: token! } }),
  });
  const appsQ = useQuery({
    queryKey: ["dashboard", "applications", token],
    enabled: !!token && tab === "applications",
    queryFn: () => apps({ data: { token: token! } }),
  });

  if (!token) return null;

  const displayName =
    (user as any)?.name || (user as any)?.full_name || (user as any)?.email || "there";

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
            Post a task
          </Link>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 rounded-full border border-border bg-card p-1 w-full max-w-md">
          <TabBtn icon={ClipboardList} label="My tasks" active={tab === "posted"} onClick={() => setTab("posted")} />
          <TabBtn icon={Briefcase} label="Applications" active={tab === "applications"} onClick={() => setTab("applications")} />
          <TabBtn icon={User} label="Profile" active={tab === "profile"} onClick={() => setTab("profile")} />
        </div>

        <section className="mt-6">
          {tab === "posted" && <Panel q={postedQ} emptyCta="Post your first task" emptyHref="/post-task" />}
          {tab === "applications" && <Panel q={appsQ} emptyCta="Browse tasks" emptyHref="/tasks/browse" />}
          {tab === "profile" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Account</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {Object.entries((user ?? {}) as Record<string, unknown>).map(([k, v]) => (
                  <div key={k} className="border-b border-border/60 pb-2">
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
                    <dd className="font-medium break-all">{String(v ?? "—")}</dd>
                  </div>
                ))}
              </dl>
              <button onClick={logout} className="mt-6 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
                Log out
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function TabBtn({ icon: Icon, label, active, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function Panel({ q, emptyCta, emptyHref }: {
  q: { data: any; isFetching: boolean };
  emptyCta: string; emptyHref: string;
}) {
  if (q.isFetching) {
    return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;
  }
  if (q.data && !q.data.ok) {
    return <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{q.data.error}</div>;
  }
  const list = extractList(q.data?.data);
  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
        Nothing here yet. <Link to={emptyHref as any} className="text-primary font-medium">{emptyCta}</Link>
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((t: any, i) => (
        <TaskCard key={t.task_id ?? t.id ?? i} task={{
          id: t.task_id ?? t.id ?? i,
          title: t.title ?? "Untitled",
          description: t.description,
          budget: t.budget,
          location: t.location,
          category: t.category,
          deadline: t.deadline,
          status: t.status,
        }} />
      ))}
    </div>
  );
}
