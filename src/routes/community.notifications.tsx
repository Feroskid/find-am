import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Bell, Check, MessageSquare, AtSign, ThumbsUp, CheckCircle2, Shield, Loader2 } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { listMyNotifications, markCommunityNotifRead } from "@/lib/community.functions";

export const Route = createFileRoute("/community/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Find-Task Community" }] }),
  component: NotificationsPage,
});

const TABS: { id: "all" | "unread" | "reply" | "mention"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "reply", label: "Replies" },
  { id: "mention", label: "Mentions" },
];

function iconFor(type: string) {
  switch (type) {
    case "reply": return <MessageSquare className="h-4 w-4 text-sky-600" />;
    case "mention": return <AtSign className="h-4 w-4 text-violet-600" />;
    case "vote": return <ThumbsUp className="h-4 w-4 text-emerald-600" />;
    case "accepted": return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "mod": return <Shield className="h-4 w-4 text-orange-600" />;
    default: return <Bell className="h-4 w-4 text-black/50" />;
  }
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

function NotificationsPage() {
  const listFn = useServerFn(listMyNotifications);
  const markFn = useServerFn(markCommunityNotifRead);
  const navigate = useNavigate();
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("all");

  const q = useQuery({ queryKey: ["community-notifs"], queryFn: () => listFn(), refetchInterval: 30000 });
  const mark = useMutation({
    mutationFn: (id?: string) => markFn({ data: id ? { id } : { all: true } }),
    onSuccess: () => q.refetch(),
  });

  const all: any[] = q.data?.ok ? q.data.data : [];
  const filtered = useMemo(() => {
    if (tab === "all") return all;
    if (tab === "unread") return all.filter((n) => !n.is_read);
    return all.filter((n) => n.type === tab);
  }, [all, tab]);

  const unreadCount = all.filter((n) => !n.is_read).length;

  const openTarget = (n: any) => {
    if (!n.is_read) mark.mutate(n.id);
    const tid = n.payload?.thread_id;
    if (tid) navigate({ to: "/community/t/$threadId", params: { threadId: tid } });
  };

  return (
    <CommunityShell>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="font-bold text-2xl inline-flex items-center gap-2">
          <Bell className="h-5 w-5" /> Notifications
          {unreadCount > 0 && <span className="text-xs font-bold bg-[#E5A54B] text-white px-2 py-0.5 rounded-full">{unreadCount}</span>}
        </h1>
        <button
          onClick={() => mark.mutate(undefined)}
          disabled={unreadCount === 0 || mark.isPending}
          className="text-xs font-semibold text-[#E5A54B] hover:underline disabled:opacity-40 disabled:no-underline"
        >
          Mark all read
        </button>
      </div>

      <div className="flex gap-1 border-b border-black/10 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px ${
              tab === t.id ? "border-[#E5A54B] text-[#E5A54B]" : "border-transparent text-black/60 hover:text-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <div className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin inline text-black/40" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-black/50 text-sm">
          <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
          {tab === "unread" ? "You're all caught up." : "No notifications yet."}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => openTarget(n)}
                className={`w-full text-left rounded-xl border p-4 flex items-start gap-3 transition-colors ${
                  n.is_read ? "bg-white border-black/10 hover:bg-black/[0.02]" : "bg-[#FFF8EC] border-[#E5A54B]/30 hover:bg-[#FFF3D9]"
                }`}
              >
                <div className="mt-0.5">{iconFor(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    {n.type === "reply" && <>New reply on <span className="font-semibold">{n.payload?.thread_title ?? "your thread"}</span></>}
                    {n.type === "mention" && <>You were mentioned</>}
                    {n.type === "accepted" && <>Your reply was accepted as the answer (+5 pts)</>}
                    {n.type === "vote" && <>Someone upvoted your post</>}
                    {n.type === "mod" && <>{n.payload?.message ?? "Moderator action"}</>}
                    {!["reply","mention","accepted","vote","mod"].includes(n.type) && n.type}
                  </div>
                  <div className="text-[11px] text-black/50 mt-1">{relTime(n.created_at)}</div>
                </div>
                {!n.is_read && <span className="mt-1 h-2 w-2 rounded-full bg-[#E5A54B]" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </CommunityShell>
  );
}
