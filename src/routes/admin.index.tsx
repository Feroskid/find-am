import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Users, ScrollText, Ban, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function Card({ to, title, desc, icon: Icon }: any) {
  return (
    <Link to={to} className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-colors block">
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
      </div>
    </Link>
  );
}

function AdminOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-ink">Welcome, Admin</h2>
        <p className="text-sm text-muted-foreground">Monitor disputes, manage users, and review platform activity.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card to="/admin/disputes" title="Open disputes" desc="Review evidence and release funds or refund posters." icon={AlertTriangle} />
        <Card to="/admin/users" title="User management" desc="Freeze, ban, reactivate users and inspect ledgers." icon={Users} />
        <Card to="/admin/blacklist" title="BVN blacklist" desc="Permanently blacklist BVN hashes for repeat offenders." icon={Ban} />
        <Card to="/admin/audit" title="Audit log" desc="Trace every admin action across the platform." icon={ScrollText} />
      </div>
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-xs text-yellow-800 dark:text-yellow-200">
        <strong>Note:</strong> All admin actions are logged. Non-admin accounts will receive access-denied responses from the backend.
      </div>
    </div>
  );
}
