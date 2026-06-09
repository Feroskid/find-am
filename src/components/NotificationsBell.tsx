import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { unreadCount } from "@/lib/findtask.functions";

function readCount(d: any): number {
  if (d == null) return 0;
  if (typeof d === "number") return d;
  return Number(d.count ?? d.unread ?? d.unread_count ?? d.total ?? 0) || 0;
}

export function NotificationsBell() {
  const { token } = useAuth();
  const fn = useServerFn(unreadCount);
  const { data } = useQuery({
    queryKey: ["notifications", "unread", token],
    enabled: !!token,
    queryFn: () => fn({ data: { token: token! } }),
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
  if (!token) return null;
  const unread = data?.ok ? readCount(data.data) : 0;
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
