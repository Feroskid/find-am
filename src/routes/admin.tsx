import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Shield, AlertTriangle, Users, ScrollText, Ban } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Find-task" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const TABS: Array<{ to: string; label: string; icon: any; exact?: boolean }> = [
  { to: "/admin", label: "Overview", icon: Shield, exact: true },
  { to: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/blacklist", label: "BVN Blacklist", icon: Ban },
  { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
];

function AdminLayout() {
  const { token, ready } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (ready && !token) navigate({ to: "/login", search: { redirect: "/admin" } as any });
  }, [ready, token, navigate]);

  if (!token) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-lg text-ink leading-tight">Admin Console</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">Find-task moderation & operations</p>
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
                to={t.to}
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
