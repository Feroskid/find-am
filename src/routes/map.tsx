import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Map as MapIcon, Info } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { Footer } from "@/components/Footer";
import { LiveTasksMap } from "@/components/LiveTasksMap";
import { listTasks } from "@/lib/findtask.functions";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Live task map — Find-task" },
      { name: "description", content: "See tasks pinned to a live map across Nigeria. Allow location to see what's near you." },
    ],
  }),
  component: MapPage,
});

function extractTasks(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.tasks ?? d.results ?? d.data ?? [];
}

function MapPage() {
  const fn = useServerFn(listTasks);
  const q = useQuery({
    queryKey: ["map-tasks"],
    queryFn: () => fn({ data: { page: 1, limit: 50 } }),
    refetchInterval: 30_000,
  });
  const tasks = q.data?.ok ? extractTasks(q.data.data) : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight inline-flex items-center gap-2">
              <MapIcon className="h-7 w-7 text-primary" /> Live task map
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tasks with GPS coordinates, refreshed every 30 seconds.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Info className="h-3.5 w-3.5" /> Click "Pin me" to use your location.</div>
        </div>
        <div className="mt-5">
          <LiveTasksMap tasks={tasks} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
