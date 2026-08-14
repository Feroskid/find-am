import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Shield, AlertTriangle, Users, ScrollText, Ban, LifeBuoy, Loader2, ShieldAlert, Flag, Radar, SpellCheck2, Banknote } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAdminGate } from "@/lib/admin-gate";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Find-task" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const TABS: Array<{ to: string; label: string; icon: any; exact?: boolean }> = [
  { to: "/admin", label: "Overview", icon: Shield, exact: true },
  { to: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
  { to: "/admin/reports", label: "Reports", icon: Flag },
  { to: "/admin/monitoring", label: "Monitoring", icon: Radar },
  { to: "/admin/support", label: "Support", icon: LifeBuoy },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/funds", label: "Held funds", icon: Banknote },
  { to: "/admin/keywords", label: "Keywords", icon: SpellCheck2 },
  { to: "/admin/blacklist", label: "BVN Blacklist", icon: Ban },
  { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
];


function AdminLayout() {
  const { token, ready } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isLoginPage = pathname.startsWith("/admin/login");
  const gate = useAdminGate(isLoginPage ? null : token, ready);

  useEffect(() => {
    if (isLoginPage) return;
    if (ready && !token) navigate({ to: "/admin/login", replace: true });
  }, [ready, token, navigate, isLoginPage]);

  if (isLoginPage) return <Outlet />;
  if (!token) return null;

  if (gate.checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Verifying admin access…
        </div>
      </div>
    );
  }

  if (!gate.isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <div className="max-w-md w-full rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-destructive" />
          <h1 className="mt-3 text-lg font-bold">Admin access required</h1>
          <p className="mt-1 text-sm text-muted-foreground">{gate.error ?? "This account does not have admin access."}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link to="/admin/login" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Admin sign in</Link>
            <Link to="/tasks" className="rounded-full border border-border px-4 py-2 text-sm font-semibold">Back to app</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-lg text-ink leading-tight">Admin Console</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {gate.admin?.name ? `Signed in as ${gate.admin.name}` : "Find-task moderation & operations"}
            </p>
          </div>
          <div className="flex-1" />
          <Link to="/tasks" className="text-xs text-muted-foreground hover:text-foreground">← Back to app</Link>
        </div>
        <nav className="mx-auto max-w-6xl px-2 flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to as any}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
