import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Briefcase } from "lucide-react";

/**
 * Floating "Dynamic Island"-style pill that lets users hop between the
 * Find-Am search engine (/) and the Find-task marketplace (/tasks).
 * Highlights whichever surface the user is currently on.
 */
export function FindAmIsland() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onTasks =
    pathname === "/tasks" || pathname.startsWith("/tasks/") ||
    pathname.startsWith("/post-task") || pathname.startsWith("/dashboard") ||
    pathname.startsWith("/wallet") || pathname.startsWith("/profile") ||
    pathname.startsWith("/messages") || pathname.startsWith("/notifications") ||
    pathname.startsWith("/explore") || pathname.startsWith("/u/");

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-foreground text-background p-0.5 sm:p-1 shadow-lg">
      <Link
        to="/"
        className={
          "inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium " +
          (!onTasks ? "bg-primary text-primary-foreground" : "opacity-80 hover:opacity-100")
        }
      >
        <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Search
      </Link>
      <Link
        to="/tasks"
        className={
          "inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium " +
          (onTasks ? "bg-primary text-primary-foreground" : "opacity-80 hover:opacity-100")
        }
      >
        <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Tasks
      </Link>
    </div>
  );
}
