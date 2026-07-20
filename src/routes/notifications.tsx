import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Loader2, Bell, CheckCheck, MessageSquare, UserCheck, Wallet, Flag,
  AlertTriangle, MapPin, Clock, CheckCircle2,
} from "lucide-react";
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

// Relative time like "2h ago", falls back to a date for older items.
function relativeTime(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

// Which day-bucket a notification belongs to.
function dayBucket(iso?: string): "Today" | "Yesterday" | "Earlier" {
  if (!iso) return "Earlier";
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = d.getTime();
  if (t >= startOfToday) return "Today";
  if (t >= startOfToday - 86400000) return "Yesterday";
  return "Earlier";
}

function typeIcon(type: string) {
  if (type.includes("message") || type.includes("chat")) return MessageSquare;
  if (type.includes("accept")) return UserCheck;
  if (type.includes("application") || type.includes("offer") || type.includes("applicant")) return CheckCircle2;
  if (type.includes("wallet") || type.includes("payment") || type.includes("credit") || type.includes("withdraw")) return Wallet;
  if (type.includes("report") || type.includes("flag")) return Flag;
  if (type.includes("dispute") || type.includes("ban") || type.includes("freeze")) return AlertTriangle;
  if (type.includes("arrive") || type.includes("location")) return MapPin;
  if (type.includes("release") || type.includes("reminder") || type.includes("expire")) return Clock;
  return Bell;
}

function NotificationsPage() {
  const { token, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && !token) navigate({ to: "/login", search: { redirect: "/notifications" } as any });
  }, [token, ready, navigate]);

  const fn = useServerFn(listNotifications);
  const mark = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllNotificationsRead);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["notifications", token, "page"],
    enabled: !!token,
    queryFn: () => fn({ data: { token: token! } }),
  });

  const items = data?.ok ? extract(data.data) : [];
  const isRead = (n: any) => !!(n.is_read || n.read || n.read_at);
  const hasUnread = items.some((n: any) => !isRead(n));

  if (!token) return null;

  // Group into day buckets, preserving order.
  const groups: Record<string, any[]> = { Today: [], Yesterday: [], Earlier: [] };
  items.forEach((n: any) => groups[dayBucket(n.created_at)].push(n));
  const order: Array<"Today" | "Yesterday" | "Earlier"> = ["Today", "Yesterday", "Earlier"];

  const renderItem = (n: any, i: number) => {
    const id = n.id ?? n.notification_id ?? String(i);
    const read = isRead(n);
    const taskId = n.task_id ?? n.taskId ?? n.related_task_id;
    const type = String(n.type ?? n.notification_type ?? "").toLowerCase();
    const Icon = typeIcon(type);

    const handleClick = async () => {
      if (!read) await mark({ data: { id: String(id), token: token! } }).catch(() => {});
    };

    const body = (
      <div
        className={
          "relative flex items-start gap-3 rounded-xl border p-4 transition-all hover:shadow-sm " +
          (read
            ? "border-border bg-card"
            : "border-primary/40 bg-primary/5 shadow-sm")
        }
      >
        {!read && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />}
        <span className={"grid h-9 w-9 shrink-0 place-items-center rounded-full ml-1 " + (read ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary")}>
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className={read ? "font-medium text-foreground/90" : "font-semibold text-ink"}>
            {n.title ?? n.type ?? "Update"}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">{n.body ?? n.message ?? ""}</div>
          {n.created_at && (
            <div className="text-xs text-muted-foreground mt-1" title={new Date(n.created_at).toLocaleString()}>
              {relativeTime(n.created_at)}
            </div>
          )}
        </div>
      </div>
    );

    const cls = "block animate-in fade-in slide-in-from-bottom-1 duration-300";

    if (taskId) {
      if (type.includes("message") || type.includes("chat")) {
        return <Link key={id} to="/tasks/$taskId/workspace" params={{ taskId: String(taskId) }} onClick={handleClick} className={cls}>{body}</Link>;
      }
      if (type.includes("application") || type.includes("offer") || type.includes("applicant")) {
        return <Link key={id} to="/tasks/$taskId/applications" params={{ taskId: String(taskId) }} onClick={handleClick} className={cls}>{body}</Link>;
      }
      return <Link key={id} to="/tasks/$taskId" params={{ taskId: String(taskId) }} onClick={handleClick} className={cls}>{body}</Link>;
    }
    return <Link key={id} to="/dashboard" onClick={handleClick} className={cls}>{body}</Link>;
  };

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

        <div className="mt-6">
          {isFetching ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : !data?.ok ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{data?.error}</div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              You're all caught up.
            </div>
          ) : (
            <div className="space-y-6">
              {order.map((bucket) =>
                groups[bucket].length > 0 ? (
                  <div key={bucket}>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{bucket}</div>
                    <div className="space-y-2">
                      {groups[bucket].map((n, i) => renderItem(n, i))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
