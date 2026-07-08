import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare, Search } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { getMyConversations } from "@/lib/findtask.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/messages/")({
  head: () => ({ meta: [{ title: "Messages — Find-task" }] }),
  component: MessagesInbox,
});

function relativeTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  if (!d) return "";
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString();
}

function initials(name?: string) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function MessagesInbox() {
  const { token, ready } = useAuth();
  const navigate = useNavigate();
  const convFn = useServerFn(getMyConversations);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (ready && !token) navigate({ to: "/login", search: { redirect: "/messages" } as any });
  }, [token, ready, navigate]);

  const convQ = useQuery({
    queryKey: ["my-conversations", token],
    enabled: !!token,
    queryFn: () => convFn({ data: { token: token! } }),
    refetchInterval: 15000,
  });

  const conversations = useMemo(() => {
    const raw: any = convQ.data?.ok ? convQ.data.data : null;
    const list: any[] = raw?.conversations ?? raw?.results ?? (Array.isArray(raw) ? raw : []);
    const filtered = q.trim()
      ? list.filter((c) => {
          const hay = `${c.other_name ?? ""} ${c.task_title ?? ""} ${c.last_message ?? ""}`.toLowerCase();
          return hay.includes(q.toLowerCase());
        })
      : list;
    return [...filtered].sort((a, b) => {
      const ax = new Date(a.last_message_at ?? a.updated_at ?? 0).getTime();
      const bx = new Date(b.last_message_at ?? b.updated_at ?? 0).getTime();
      return bx - ax;
    });
  }, [convQ.data, q]);

  if (!token) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-2xl px-0 sm:px-4 py-0 sm:py-6 flex-1">
        <div className="bg-card sm:rounded-2xl sm:border sm:border-border overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
            <h1 className="font-display text-2xl text-ink inline-flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Chats
            </h1>
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search conversations"
                className="w-full rounded-full bg-muted/60 pl-9 pr-4 py-2 text-sm outline-none focus:bg-muted"
              />
            </div>
          </div>

          {/* List */}
          {convQ.isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading chats…
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary mb-3">
                <MessageSquare className="h-7 w-7" />
              </div>
              <p className="text-muted-foreground">
                No messages yet. Once you accept an offer or apply to a task, chats will show up here.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <Link
                  to="/tasks/browse"
                  search={{ q: "", category_id: 0, location: "", is_remote: 0, page: 1 } as any}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground"
                >
                  Browse tasks
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {conversations.map((c) => {
                const id = String(c.task_id ?? c.id);
                const name = c.other_name ?? c.name ?? "Chat";
                const unread = Number(c.unread_count ?? 0);
                return (
                  <li key={id + (c.other_id ?? "")}>
                    <Link
                      to="/messages/$taskId"
                      params={{ taskId: id }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
                        {initials(name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="font-semibold text-ink truncate">{name}</div>
                          <div className="text-[11px] text-muted-foreground shrink-0">
                            {relativeTime(c.last_message_at)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs text-muted-foreground truncate">
                            <span className="text-foreground/70 font-medium">{c.task_title ?? "Task"}</span>
                            {c.last_message ? <span> · {c.last_message}</span> : null}
                          </div>
                          {unread > 0 && (
                            <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold inline-flex items-center justify-center">
                              {unread > 99 ? "99+" : unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
