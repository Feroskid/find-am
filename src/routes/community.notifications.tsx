import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { listMyNotifications, markCommunityNotifRead } from "@/lib/community.functions";

export const Route = createFileRoute("/community/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Find-Task Community" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const listFn = useServerFn(listMyNotifications);
  const markFn = useServerFn(markCommunityNotifRead);
  const q = useQuery({ queryKey: ["community-notifs"], queryFn: () => listFn() });
  const mark = useMutation({ mutationFn: (id?: string) => markFn({ data: id ? { id } : { all: true } }), onSuccess: () => q.refetch() });

  return (
    <CommunityShell>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold text-2xl inline-flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</h1>
        <button onClick={() => mark.mutate(undefined)} className="text-xs font-semibold text-[#E5A54B] hover:underline">Mark all read</button>
      </div>
      <ul className="space-y-2">
        {(q.data?.ok ? q.data.data : []).map((n: any) => (
          <li key={n.id} className={`rounded-xl border border-black/10 p-4 flex items-start gap-3 ${n.is_read ? "bg-white" : "bg-[#FFF8EC] border-[#E5A54B]/30"}`}>
            <div className="flex-1">
              <div className="text-sm">
                {n.type === "reply" ? (
                  <>New reply on <Link to="/community/t/$threadId" params={{ threadId: n.payload?.thread_id }} className="font-semibold underline">{n.payload?.thread_title ?? "your thread"}</Link></>
                ) : n.type}
              </div>
              <div className="text-[11px] text-black/50 mt-1">{new Date(n.created_at).toLocaleString()}</div>
            </div>
            {!n.is_read && (
              <button onClick={() => mark.mutate(n.id)} className="p-1 rounded hover:bg-black/5" aria-label="Mark read"><Check className="h-4 w-4" /></button>
            )}
          </li>
        ))}
        {q.data?.ok && q.data.data.length === 0 && <p className="text-sm text-black/50">No notifications yet.</p>}
      </ul>
    </CommunityShell>
  );
}
