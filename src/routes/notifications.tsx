import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2, Bell, CheckCheck } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { useAuth } from "@/lib/auth";
import { listNotifications, markNotificationRead } from "@/lib/findtask.functions";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Find-task" }] }),
  component: NotificationsPage,
});

function extract(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.notifications ?? d.data ?? d.results ?? [];
}

function NotificationsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!token) navigate({ to: "/login", search: { redirect: "/notifications" } as any });
  }, [token, navigate]);

  const fn = useServerFn(listNotifications);
  const mark = useServerFn(markNotificationRead);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["notifications", token, "page"],
    enabled: !!token,
    queryFn: () => fn({ data: { token: token! } }),
  });

  if (!token) return null;
  const items = data?.ok ? extract(data.data) : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 flex-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight inline-flex items-center gap-2">
            <Bell className="h-6 w-6" /> Notifications
          </h1>
        </div>

        <div className="mt-6 space-y-2">
          {isFetching ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : !data?.ok ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{data?.error}</div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              You're all caught up.
            </div>
          ) : (
            items.map((n: any, i: number) => {
              const id = n.id ?? n.notification_id ?? String(i);
              const read = !!(n.read || n.read_at);
              const taskId = n.task_id ?? n.taskId;
              const body = (
                <div className={`flex items-start gap-3 rounded-xl border p-4 ${read ? "border-border bg-card" : "border-primary/40 bg-primary/5"}`}>
                  <div className="flex-1">
                    <div className="font-medium">{n.title ?? n.type ?? "Update"}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{n.body ?? n.message ?? ""}</div>
                    {n.created_at && <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>}
                  </div>
                  {!read && (
                    <button
                      onClick={async (e) => { e.preventDefault(); await mark({ data: { id: String(id), token: token! } }); refetch(); }}
                      className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Mark read
                    </button>
                  )}
                </div>
              );
              return taskId ? (
                <Link key={id} to="/tasks/$taskId" params={{ taskId: String(taskId) }} className="block">{body}</Link>
              ) : (
                <div key={id}>{body}</div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
