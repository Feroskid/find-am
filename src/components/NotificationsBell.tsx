import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { listNotifications } from "@/lib/findtask.functions";

function extract(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.notifications ?? d.data ?? d.results ?? [];
}

export function NotificationsBell() {
  const { token } = useAuth();
  const fn = useServerFn(listNotifications);
  const { data } = useQuery({
    queryKey: ["notifications", token],
    enabled: !!token,
    queryFn: () => fn({ data: { token: token! } }),
    refetchInterval: 60_000,
  });
  if (!token) return null;
  const items = data?.ok ? extract(data.data) : [];
  const unread = items.filter((n: any) => !n.read && !n.read_at).length;
  return (
    <Link
      to="/notifications"
      className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-muted text-foreground/80 hover:text-foreground"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center justify-center">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
