import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, User, Briefcase, Search, FolderTree, Map as MapIcon, Users, Plus, LayoutDashboard, Wallet, MessageSquare, Bell, ShieldCheck, FileText, LogOut, LogIn, UserPlus, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface Item { to: string; label: string; icon: any }

function Section({ title, items, onClick }: { title: string; items: Item[]; onClick: () => void }) {
  return (
    <div>
      <div className="px-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{title}</div>
      <ul className="mt-1.5">
        {items.map((it) => (
          <li key={it.to}>
            <Link
              to={it.to as any}
              onClick={onClick}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              <it.icon className="h-4 w-4 text-primary" /> {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MainMenu() {
  const [open, setOpen] = useState(false);
  const { token, user, logout } = useAuth();
  const close = () => setOpen(false);

  const name = (user as any)?.name || (user as any)?.full_name || (user as any)?.email || "Guest";

  return (
    <>
      <button
        aria-label="Menu"
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 place-items-center rounded-full hover:bg-accent text-foreground"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <aside className="absolute left-0 top-0 h-full w-[88%] max-w-sm bg-background shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-4 py-3">
              <span className="font-display text-xl text-primary">Find-task</span>
              <button onClick={close} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>

            {token ? (
              <Link to="/profile" onClick={close} className="flex items-center gap-3 border-b border-border px-4 py-4 hover:bg-accent">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary font-bold">
                  {String(name).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{name}</div>
                  <div className="text-xs text-muted-foreground">View profile</div>
                </div>
              </Link>
            ) : (
              <div className="flex gap-2 border-b border-border px-4 py-4">
                <Link to="/login" onClick={close} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  <LogIn className="h-4 w-4" /> Log in
                </Link>
                <Link to="/register" onClick={close} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold">
                  <UserPlus className="h-4 w-4" /> Sign up
                </Link>
              </div>
            )}

            <div className="space-y-5 p-4">
              <Section
                title="Tasks"
                onClick={close}
                items={[
                  { to: "/explore", label: "Browse tasks", icon: Search },
                  { to: "/tasks/categories", label: "Categories", icon: FolderTree },
                  { to: "/tasks/mine", label: "My tasks", icon: Briefcase },
                  { to: "/post-task", label: "Post a task", icon: Plus },
                ]}
              />
              <Section
                title="Discover"
                onClick={close}
                items={[
                  { to: "/map", label: "Live task map", icon: MapIcon },
                  { to: "/community", label: "Community", icon: Users },
                ]}
              />
              {token && (
                <Section
                  title="Account"
                  onClick={close}
                  items={[
                    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
                    { to: "/wallet", label: "Wallet", icon: Wallet },
                    { to: "/messages", label: "Messages", icon: MessageSquare },
                    { to: "/notifications", label: "Notifications", icon: Bell },
                    { to: "/profile", label: "Profile", icon: User },
                    { to: "/verify-email", label: "Verify email", icon: Mail },
                  ]}
                />
              )}
              <Section
                title="Support"
                onClick={close}
                items={[
                  { to: "/terms", label: "Terms & Privacy", icon: ShieldCheck },
                  { to: "/community", label: "Help center", icon: FileText },
                ]}
              />

              {token && (
                <button
                  onClick={() => { logout(); close(); }}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
