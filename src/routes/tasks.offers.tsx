import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2, ListChecks, ArrowRight } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { useAuth } from "@/lib/auth";
import { getMyApplications } from "@/lib/findtask.functions";

export const Route = createFileRoute("/tasks/offers")({
  head: () => ({
    meta: [
      { title: "My offers — Find-task" },
      { name: "description", content: "Every offer you've made on Find-task — pending, accepted and declined — in one place." },
    ],
  }),
  component: MyOffersPage,
});

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  accepted: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  assigned: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  declined: "bg-destructive/15 text-destructive",
  rejected: "bg-destructive/15 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
  completed: "bg-primary/15 text-primary",
};

function MyOffersPage() {
  const { token, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && !token) navigate({ to: "/login", search: { redirect: "/tasks/offers" } as any });
  }, [token, ready, navigate]);

  const fn = useServerFn(getMyApplications);
  const q = useQuery({
    queryKey: ["my-applications", token],
    enabled: !!token,
    queryFn: () => fn({ data: { token: token! } }),
  });

  if (!token) return null;
  const data: any = q.data?.ok ? q.data.data : null;
  const apps: any[] = data?.applications ?? data?.results ?? (Array.isArray(data) ? data : []);

  const groups: Record<string, any[]> = { active: [], assigned: [], past: [] };
  for (const a of apps) {
    const status = String(a.status ?? a.application_status ?? "pending").toLowerCase();
    const taskStatus = String(a.task?.status ?? "").toLowerCase();
    if (status === "accepted" || taskStatus === "assigned" || taskStatus === "in_progress") groups.assigned.push(a);
    else if (["declined", "rejected", "withdrawn", "completed"].includes(status) || taskStatus === "completed") groups.past.push(a);
    else groups.active.push(a);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 flex-1">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ListChecks className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-3xl text-ink">My offers</h1>
            <p className="text-sm text-muted-foreground">Pending offers, assigned tasks and past activity in one place.</p>
          </div>
        </div>

        {q.isFetching && !apps.length ? (
          <div className="mt-10 inline-flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading offers…</div>
        ) : !q.data?.ok ? (
          <div className="mt-10 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{q.data?.error ?? "Couldn't load your offers."}</div>
        ) : apps.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            <p className="text-sm">You haven't made any offers yet.</p>
            <Link to="/tasks/browse" search={{ q: "", category_id: 0, location: "", is_remote: 0, page: 1 }} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Browse tasks <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            <OfferGroup title="Assigned to you" subtitle="Tasks where your offer was accepted." apps={groups.assigned} />
            <OfferGroup title="Awaiting response" subtitle="Offers the poster hasn't decided on yet." apps={groups.active} />
            <OfferGroup title="Past offers" subtitle="Declined, withdrawn or completed." apps={groups.past} />
          </div>
        )}
      </main>
    </div>
  );
}

function OfferGroup({ title, subtitle, apps }: { title: string; subtitle: string; apps: any[] }) {
  if (!apps.length) return null;
  return (
    <section>
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <ul className="mt-3 space-y-3">
        {apps.map((a, i) => {
          const t = a.task ?? a;
          const taskId = a.task_id ?? t.task_id ?? t.id ?? a.id;
          const title = t.title ?? "Untitled task";
          const budget = Number(t.budget ?? a.amount ?? 0);
          const status = String(a.status ?? a.application_status ?? "pending").toLowerCase();
          const created = a.created_at ?? a.applied_at ?? t.created_at;
          return (
            <li key={taskId ?? i}>
              <Link
                to="/tasks/$taskId"
                params={{ taskId: String(taskId) }}
                className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-ink truncate">{title}</h3>
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                      <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider " + (STATUS_STYLES[status] ?? "bg-muted text-muted-foreground")}>{status}</span>
                      {created && <span>· {new Date(created).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display text-lg text-ink">₦{budget.toLocaleString()}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Budget</div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
