import { Link } from "@tanstack/react-router";
import { Menu, X, LayoutDashboard, Plus, MessageSquare, Wallet, User, Compass, Map as MapIcon, Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { NotificationsBell } from "@/components/NotificationsBell";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { FindAmIsland } from "@/components/FindAmIsland";
import { ThemeToggle } from "@/components/ThemeToggle";

export function TaskHeader() {
  const [open, setOpen] = useState(false);
  const { token, logout, mode } = useAuth();
  const isTasker = mode === "tasker";

  return (
    <div className="sticky top-0 z-30 w-full">
      {/* Dynamic Island row — sits ABOVE the header on desktop so it never covers content */}
      <div className="hidden md:flex justify-center bg-background/95 backdrop-blur border-b border-border/60 py-1.5">
        <FindAmIsland />
      </div>

      <header className="w-full border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 gap-3">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <ThemeToggle />
            <Link to="/tasks" className="font-extrabold text-xl sm:text-2xl tracking-tight text-primary shrink-0">
              Find-task
            </Link>
            <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-foreground/80">
              <Link to="/explore" className="hover:text-foreground inline-flex items-center gap-1"><Compass className="h-4 w-4" />Explore</Link>
              <Link to="/tasks/categories" className="hover:text-foreground">Categories</Link>
              <Link to="/map" className="hover:text-foreground inline-flex items-center gap-1"><MapIcon className="h-4 w-4" />Map</Link>
              <Link to="/community" className="hover:text-foreground">Community</Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {token ? (
              <>
                <ModeSwitcher />
                <NotificationsBell />
                <Link to="/messages" className="text-foreground/80 hover:text-foreground" aria-label="Messages">
                  <MessageSquare className="h-4 w-4" />
                </Link>
                <Link to="/wallet" className="text-foreground/80 hover:text-foreground" aria-label="Wallet">
                  <Wallet className="h-4 w-4" />
                </Link>
                <Link to="/profile" className="text-foreground/80 hover:text-foreground" aria-label="Profile">
                  <User className="h-4 w-4" />
                </Link>
                <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-foreground">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <button onClick={logout} className="text-sm font-medium text-foreground/80 hover:text-foreground">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-foreground/80 hover:text-foreground">Log in</Link>
                <Link to="/register" className="text-sm font-medium text-foreground/80 hover:text-foreground">Sign up</Link>
              </>
            )}
            {isTasker ? (
              <Link
                to="/explore"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Search className="h-4 w-4" /> Apply to tasks
              </Link>
            ) : (
              <Link
                to="/post-task"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Post a task
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 -mr-2 text-foreground"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-3 flex flex-col gap-3 text-sm">
              <div className="flex justify-center pb-2"><FindAmIsland /></div>
              {token && <div className="pb-2"><ModeSwitcher /></div>}
              <Link to="/explore" onClick={() => setOpen(false)}>Explore</Link>
              <Link to="/tasks/categories" onClick={() => setOpen(false)}>Categories</Link>
              <Link to="/map" onClick={() => setOpen(false)}>Live map</Link>
              <Link to="/community" onClick={() => setOpen(false)}>Community</Link>
              {isTasker ? (
                <Link to="/explore" onClick={() => setOpen(false)} className="font-semibold text-primary">Apply to tasks</Link>
              ) : (
                <Link to="/post-task" onClick={() => setOpen(false)} className="font-semibold text-primary">Post a task</Link>
              )}
              <div className="h-px bg-border" />
              {token ? (
                <>
                  <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                  <Link to="/profile" onClick={() => setOpen(false)}>Profile</Link>
                  <Link to="/wallet" onClick={() => setOpen(false)}>Wallet</Link>
                  <Link to="/messages" onClick={() => setOpen(false)}>Messages</Link>
                  <Link to="/notifications" onClick={() => setOpen(false)}>Notifications</Link>
                  <button onClick={() => { logout(); setOpen(false); }} className="text-left">Log out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
                  <Link to="/register" onClick={() => setOpen(false)}>Sign up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
