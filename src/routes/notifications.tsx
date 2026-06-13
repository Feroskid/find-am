import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Bell, CheckCheck } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { useAuth } from "@/lib/auth";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/findtask.functions";

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
  const { token, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && !token) navigate({ to: "/login", search: { redirect: "/notifications" } as any });
  }, [token, navigate]);

  const fn = useServerFn(listNotifications);
  const mark = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllNotificationsRead);
  const [busy, setBusy] = useState(false);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["notifications", token, "page"],
    enabled: !!token,
    queryFn: () => fn({ data: { token: token! } }),
  });

  if (!token) return null;
  const items = data?.ok ? extract(data.data) : [];
  const hasUnread = items.some((n: any) => !n.read && !n.read_at);

  // Auto-mark all as read on view (most users expect opening the inbox to clear the badge).
  useEffect(() => {
    if (!hasUnread || busy) return;
    setBusy(true);
    markAll({ data: { token: token! } })
      .catch(() => {})
      .finally(() => { setBusy(false); refetch(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnread]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 flex-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight inline-flex items-center gap-2">
            <Bell className="h-6 w-6" /> Notifications
          </h1>
          {hasUnread && (
            <button
              onClick={async () => { await markAll({ data: { token: token! } }); refetch(); }}
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
          )}
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
              const handleClick = async () => {
                if (!read) await mark({ data: { id: String(id), token: token! } }).catch(() => {});
              };
              const body = (
                <div className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${read ? "border-border bg-card" : "border-primary/40 bg-primary/5"}`}>
                  <div className="flex-1">
                    <div className="font-medium">{n.title ?? n.type ?? "Update"}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{n.body ?? n.message ?? ""}</div>
                    {n.created_at && <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>}
                  </div>
                </div>
              );
              return taskId ? (
                <Link key={id} to="/tasks/$taskId" params={{ taskId: String(taskId) }} onClick={handleClick} className="block">{body}</Link>
              ) : (
                <div key={id} onClick={handleClick} className="cursor-pointer">{body}</div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
