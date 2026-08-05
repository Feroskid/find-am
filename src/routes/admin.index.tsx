import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Users, ScrollText, Ban, ArrowRight, LifeBuoy } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { adminListTickets } from "@/lib/support.functions";
import { adminListDisputes } from "@/lib/findtask.functions";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function Card({ to, title, desc, icon: Icon, badge }: { to: string; title: string; desc: string; icon: any; badge?: string | null }) {
  return (
    <Link to={to as any} className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-colors block">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ink flex items-center gap-1">
            {title} <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{desc}</p>
        </div>
        {badge && (
          <span className="rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 text-[11px] font-bold shrink-0">{badge}</span>
        )}
      </div>
    </Link>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "warn" | "good" }) {
  const toneCls =
    tone === "warn" ? "text-amber-600 dark:text-amber-400" : tone === "good" ? "text-emerald-600 dark:text-emerald-400" : "text-ink";
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${toneCls}`}>{value}</div>
    </div>
  );
}

function AdminOverview() {
  const { token } = useAuth();
  const ticketsFn = useServerFn(adminListTickets);
  const disputesFn = useServerFn(adminListDisputes);

  const ticketsQ = useQuery({
    queryKey: ["admin", "tickets", "counts", token],
    enabled: !!token,
    queryFn: () => ticketsFn({ data: { token: token!, status: "open" } }),
  });
  const disputesQ = useQuery({
    queryKey: ["admin", "disputes", "overview", token],
    enabled: !!token,
    queryFn: () => disputesFn({ data: { token: token!, status: "open" } as any }),
  });

  const counts: any = (ticketsQ.data as any)?.ok ? (ticketsQ.data as any).counts : null;
  const disputesRaw: any = (disputesQ.data as any)?.ok ? (disputesQ.data as any).data : null;
  const disputes: any[] = Array.isArray(disputesRaw)
    ? disputesRaw
    : (disputesRaw?.disputes ?? disputesRaw?.results ?? disputesRaw?.data ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-ink">Welcome, Admin</h2>
        <p className="text-sm text-muted-foreground">Monitor disputes, support requests, users, and platform activity.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Open disputes" value={disputesQ.isPending ? "…" : disputes.length} tone={disputes.length ? "warn" : "good"} />
        <Stat label="Open tickets" value={ticketsQ.isPending ? "…" : (counts?.open ?? 0)} tone={counts?.open ? "warn" : "good"} />
        <Stat label="Answered tickets" value={ticketsQ.isPending ? "…" : (counts?.answered ?? 0)} />
        <Stat label="All tickets" value={ticketsQ.isPending ? "…" : (counts?.total ?? 0)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card to="/admin/disputes" title="Open disputes" desc="Review evidence and release funds or refund posters." icon={AlertTriangle} badge={disputes.length ? String(disputes.length) : null} />
        <Card to="/admin/support" title="Customer support" desc="Read and reply to support requests from users." icon={LifeBuoy} badge={counts?.open ? String(counts.open) : null} />
        <Card to="/admin/users" title="User management" desc="Freeze, ban, reactivate users and inspect ledgers." icon={Users} />
        <Card to="/admin/blacklist" title="BVN blacklist" desc="Permanently blacklist BVN hashes for repeat offenders." icon={Ban} />
        <Card to="/admin/audit" title="Audit log" desc="Trace every admin action across the platform." icon={ScrollText} />
      </div>

      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-xs text-yellow-800 dark:text-yellow-200">
        <strong>Note:</strong> All admin actions are logged. Non-admin accounts are blocked from this console.
      </div>
    </div>
  );
}
