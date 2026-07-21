import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { NotificationsBell } from "@/components/NotificationsBell";
import { FindAmIsland } from "@/components/FindAmIsland";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VerifyEmailBanner } from "@/components/VerifyEmailBanner";
import { MainMenu } from "@/components/MainMenu";

export function TaskHeader() {
  const { token } = useAuth();

  return (
    <div className="sticky top-0 z-30 w-full">
      <VerifyEmailBanner />
      {/* Dynamic Island row — kept above the header */}
      <div className="flex justify-center bg-background/95 backdrop-blur border-b border-border/60 py-1.5">
        <FindAmIsland />
      </div>

      <header className="w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:px-6 py-2.5">
          <div className="flex items-center gap-1">
            <MainMenu />
            <div className="hidden sm:block"><ThemeToggle /></div>
          </div>

          <div className="flex justify-center">
            <Link to="/tasks" className="font-display text-2xl sm:text-3xl tracking-tight text-primary">
              Find-task
            </Link>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <nav className="hidden lg:flex items-center gap-5 text-xs font-bold uppercase tracking-wider text-foreground/80 mr-2">
              <Link to="/explore" className="hover:text-primary">Browse</Link>
              <Link to="/tasks/categories" className="hover:text-primary">Categories</Link>
              <Link to="/tasks/mine" className="hover:text-primary">My tasks</Link>
              {token && <Link to="/dashboard" className="hover:text-primary">My dashboard</Link>}
            </nav>
            {token && <NotificationsBell />}
            <Link
              to="/post-task"
              aria-label="Post a task"
              className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow hover:opacity-90"
            >
              <Plus className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}
