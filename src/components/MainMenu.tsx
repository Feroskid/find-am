import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ChevronRight, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";

interface Row { to: string; label: string; chevron?: boolean }

export function MainMenu() {
  const [open, setOpen] = useState(false);
  const { token, user, mode, logout } = useAuth();
  const close = () => setOpen(false);

  const name = (user as any)?.name || (user as any)?.full_name || (user as any)?.email || "Guest";
  const u: any = user ?? {};
  const isAdmin = Boolean(
    u.is_admin || u.admin || u.is_staff ||
    (typeof u.role === "string" && ["admin", "moderator", "staff"].includes(u.role.toLowerCase())) ||
    (Array.isArray(u.roles) && u.roles.some((r: any) => typeof r === "string" && ["admin", "moderator", "staff"].includes(r.toLowerCase())))
  );

  const main: Row[] = token
    ? [
        { to: "/tasks", label: "Home" },
        ...(mode === "tasker"
          ? [{ to: "/dashboard", label: "My Tasker Dashboard" }]
          : [{ to: "/dashboard", label: "My Dashboard" }]),
        { to: "/explore", label: "Browse tasks" },
        { to: "/tasks/mine", label: "My tasks" },
        { to: "/messages", label: "Messages" },
        { to: "/wallet", label: "Payment history" },
        { to: "/wallet", label: "Payment methods" },
        { to: "/notifications", label: "Notifications" },
        { to: "/profile", label: "Settings", chevron: true },
        { to: "/tasks/categories", label: "Discover", chevron: true },
        { to: "/community", label: "Help topics", chevron: true },
        ...(isAdmin ? [{ to: "/admin", label: "Admin Console", chevron: true }] : []),
      ]
    : [
        { to: "/tasks", label: "Home" },
        { to: "/explore", label: "Browse tasks" },
        { to: "/tasks/categories", label: "Discover", chevron: true },
        { to: "/community", label: "Help topics", chevron: true },
        { to: "/login", label: "Log in" },
        { to: "/register", label: "Sign up" },
      ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Menu"
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-accent text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-full sm:max-w-[420px] p-0 overflow-y-auto flex flex-col gap-0 [&>button]:hidden"
      >
        {/* Top bar with X + Post a task CTA (Airtasker style) */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-background px-4 pt-4 pb-3 border-b border-border">
          <button
            onClick={close}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
          <Link
            to="/post-task"
            onClick={close}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Post a task
          </Link>
        </div>

        {token && (
          <Link
            to="/profile"
            onClick={close}
            className="px-5 py-4 border-b border-border hover:bg-accent block"
          >
            <div className="font-semibold text-ink truncate">{name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Public Profile</div>
          </Link>
        )}

        <ul className="flex-1">
          {main.map((row, i) => (
            <li key={`${row.to}-${i}`}>
              <Link
                to={row.to as any}
                onClick={close}
                className="flex items-center justify-between px-5 py-3.5 text-[15px] text-ink hover:bg-accent border-b border-border/40"
              >
                <span>{row.label}</span>
                {row.chevron && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </Link>
            </li>
          ))}
          {token && (
            <li>
              <button
                onClick={() => { logout(); close(); }}
                className="flex w-full items-center px-5 py-3.5 text-[15px] text-ink hover:bg-accent border-b border-border/40"
              >
                Logout
              </button>
            </li>
          )}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
