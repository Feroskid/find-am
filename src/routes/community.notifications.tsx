import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Bell, MessageSquare, AtSign, CheckCircle2, Loader2 } from "lucide-react";
import { CommunityShell, AuthorChip } from "@/components/community/CommunityShell";
import { listNotifications, markNotificationsRead } from "@/lib/community.functions";
import { useCommunityMe, relTime } from "@/lib/community-client";

export const Route = createFileRoute("/community/notifications")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Notifications — Find-Task Community" },
      { name: "description", content: "Replies, mentions and accepted answers from the Find-Task community." },
    ],
  }),
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
    case "accepted": return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    default: return <Bell className="h-4 w-4 text-black/50" />;
  }
}

function NotificationsPage() {
  const navigate = useNavigate();
  const c = useCommunityMe();
  const listFn = useServerFn(listNotifications);
  const markFn = useServerFn(markNotificationsRead);
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("all");

  useEffect(() => {
    if (c.ready && !c.signedIn) navigate({ to: "/login" });
  }, [c.ready, c.signedIn, navigate]);

  const q = useQuery({
    queryKey: ["community", "notifs", c.token],
    enabled: !!c.token,
    refetchInterval: 60_000,
    queryFn: () => listFn({ data: { token: c.token!, perPage: 50 } }),
  });

  const mark = useMutation({
    mutationFn: (ids?: string[]) => markFn({ data: { token: c.token!, ids } }),
    onSuccess: () => q.refetch(),
  });

  const payload: any = q.data?.ok ? q.data.data : null;
  const all: any[] = payload?.notifications ?? [];
  const unreadCount: number = payload?.unread ?? all.filter((n) => !n.is_read).length;

  // Mark everything read once the page has been opened and shows unread items.
  useEffect(() => {
    if (unreadCount > 0 && !mark.isPending) mark.mutate(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadCount > 0]);

  const filtered = useMemo(() => {
    if (tab === "all") return all;
    if (tab === "unread") return all.filter((n) => !n.is_read);
    return all.filter((n) => n.type === tab);
  }, [all, tab]);

  const open = (n: any) => {
    if (!n.is_read) mark.mutate([String(n.id)]);
    const tid = n.payload?.thread_id;
    if (tid) navigate({ to: "/community/t/$threadId", params: { threadId: String(tid) }, search: { page: 1 } });
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
            className={`px-3 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px ${tab === t.id ? "border-[#E5A54B] text-[#E5A54B]" : "border-transparent text-black/60 hover:text-black"}`}
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
                onClick={() => open(n)}
                className={`w-full text-left rounded-xl border p-4 flex items-start gap-3 transition-colors ${n.is_read ? "bg-white border-black/10 hover:bg-black/[0.02]" : "bg-[#FFF8EC] border-[#E5A54B]/30 hover:bg-[#FFF3D9]"}`}
              >
                <div className="mt-0.5">{iconFor(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    {n.type === "reply" && <>New reply on <span className="font-semibold">{n.payload?.thread_title ?? "your thread"}</span></>}
                    {n.type === "mention" && <>You were mentioned in <span className="font-semibold">{n.payload?.thread_title ?? "a thread"}</span></>}
                    {n.type === "accepted" && <>Your reply was accepted as the answer (+5 pts)</>}
                    {!["reply", "mention", "accepted"].includes(n.type) && n.type}
                  </div>
                  <div className="text-[11px] text-black/50 mt-1 flex items-center gap-2 flex-wrap">
                    {n.actor && <AuthorChip author={n.actor} size={4} />}
                    <span>· {relTime(n.created_at)}</span>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </CommunityShell>
  );
}
