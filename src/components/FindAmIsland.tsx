import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Briefcase } from "lucide-react";

/**
 * Floating "Dynamic Island"-style pill that lets users hop between the
 * Find-Am search engine (/) and the Find-task marketplace (/tasks).
 * Highlights whichever surface the user is currently on using the
 * shared --island-active purple token.
 */
export function FindAmIsland() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onTasks =
    pathname === "/tasks" || pathname.startsWith("/tasks/") ||
    pathname.startsWith("/post-task") || pathname.startsWith("/dashboard") ||
    pathname.startsWith("/wallet") || pathname.startsWith("/profile") ||
    pathname.startsWith("/messages") || pathname.startsWith("/notifications") ||
    pathname.startsWith("/explore") || pathname.startsWith("/u/") ||
    pathname.startsWith("/map") || pathname.startsWith("/community");

  const pill =
    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition";
  const active = "bg-island-active text-primary-foreground shadow-sm";
  const idle = "text-background/80 hover:text-background";

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-foreground p-0.5 shadow-md ring-1 ring-black/5">
      <Link to="/" className={`${pill} ${!onTasks ? active : idle}`}>
        <Search className="h-3.5 w-3.5" /> Find-Am
      </Link>
      <Link to="/tasks" className={`${pill} ${onTasks ? active : idle}`}>
        <Briefcase className="h-3.5 w-3.5" /> Find-task
      </Link>
    </div>
  );
}
