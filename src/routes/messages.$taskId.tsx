import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Send, Loader2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { getTask, listMessages, sendMessage } from "@/lib/findtask.functions";
import { roomSecret, encryptText, decryptText } from "@/lib/e2ee";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/messages/$taskId")({
  head: () => ({ meta: [{ title: "Chat — Find-task" }] }),
  component: ChatPage,
});

function extractMsgs(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.messages ?? d.results ?? d.data ?? [];
}

function fmtTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const y = new Date(); y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function initials(name?: string) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function ChatPage() {
  const { taskId } = Route.useParams();
  const { token, ready, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !token) navigate({ to: "/login", search: { redirect: `/messages/${taskId}` } as any });
  }, [token, ready, taskId, navigate]);

  const tFn = useServerFn(getTask);
  const mFn = useServerFn(listMessages);
  const sFn = useServerFn(sendMessage);

  const taskQ = useQuery({
    queryKey: ["task", taskId],
    enabled: !!taskId,
    queryFn: () => tFn({ data: { taskId } }),
  });
  const msgsQ = useQuery({
    queryKey: ["messages", taskId, token],
    enabled: !!token,
    queryFn: () => mFn({ data: { taskId, token: token! } }),
    refetchInterval: 5000,
  });

  const task: any = taskQ.data?.ok ? ((taskQ.data.data as any)?.task ?? taskQ.data.data) : null;
  const raw = msgsQ.data?.ok ? extractMsgs(msgsQ.data.data) : [];

  const myId = (user as any)?.user_id ?? (user as any)?.id;
  const posterId = task?.poster_id ?? task?.user_id ?? task?.owner_id;
  const taskerId = task?.tasker_id ?? task?.accepted_tasker_id ?? task?.assigned_to;
  const secret = useMemo(
    () => roomSecret(taskId, [posterId, taskerId, myId].filter(Boolean) as any),
    [taskId, posterId, taskerId, myId],
  );

  const otherName = useMemo(() => {
    if (!task) return "Chat";
    if (String(myId) === String(posterId)) return task.tasker_name ?? task.assigned_tasker_name ?? "Tasker";
    return task.poster_name ?? "Poster";
  }, [task, myId, posterId]);

  const [decrypted, setDecrypted] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const m of raw) {
        const k = String(m.message_id ?? m.id ?? `${m.created_at}-${m.sender_id}`);
        const text = m.message_text ?? m.body ?? m.message ?? m.text ?? "";
        next[k] = await decryptText(String(text), secret);
      }
      if (!cancelled) setDecrypted(next);
    })();
    return () => { cancelled = true; };
  }, [raw, secret]);

  const [draft, setDraft] = useState("");
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [decrypted]);

  const sendM = useMutation({
    mutationFn: async () => {
      const cipher = await encryptText(draft.trim(), secret);
      return sFn({ data: { taskId, message_text: cipher, token: token! } });
    },
    onSuccess: (r) => r.ok ? (setDraft(""), msgsQ.refetch()) : toast.error(r.error),
  });

  const grouped = useMemo(() => {
    const out: Array<{ day: string; items: any[] }> = [];
    raw.forEach((m) => {
      const d = fmtDay(m.created_at ?? m.sent_at);
      const last = out[out.length - 1];
      if (last && last.day === d) last.items.push(m);
      else out.push({ day: d, items: [m] });
    });
    return out;
  }, [raw]);

  if (!token) return null;

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-3 py-2 border-b border-border bg-card">
        <Link to="/messages" className="p-2 rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
          {initials(otherName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ink truncate">{otherName}</div>
          <Link
            to="/tasks/$taskId"
            params={{ taskId }}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 truncate max-w-full"
          >
            <Briefcase className="h-3 w-3" />
            <span className="truncate">{task?.title ?? "Task"}</span>
          </Link>
        </div>
        <Link
          to="/tasks/$taskId/workspace"
          params={{ taskId }}
          className="text-xs font-semibold text-primary hover:underline shrink-0 px-2"
        >
          Workspace
        </Link>
      </header>

      {/* Messages */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-3 py-4 bg-muted/20">
        {msgsQ.isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : raw.length === 0 ? (
          <div className="text-center text-muted-foreground py-20 text-sm">
            No messages yet. Send the first one below.
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {grouped.map((g) => (
              <div key={g.day}>
                <div className="flex justify-center my-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-background/70 text-muted-foreground px-2 py-0.5 rounded-full">
                    {g.day}
                  </span>
                </div>
                {g.items.map((m) => {
                  const k = String(m.message_id ?? m.id ?? `${m.created_at}-${m.sender_id}`);
                  const mine = String(m.sender_id ?? m.user_id) === String(myId);
                  const text = decrypted[k] ?? "…";
                  return (
                    <div key={k} className={`flex mb-1 ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm text-sm break-words ${
                          mine
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-card text-foreground rounded-bl-md border border-border"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{text}</div>
                        <div className={`mt-0.5 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"} text-right`}>
                          {fmtTime(m.created_at ?? m.sent_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => { e.preventDefault(); if (draft.trim() && !sendM.isPending) sendM.mutate(); }}
        className="flex items-end gap-2 px-3 py-2 border-t border-border bg-card"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (draft.trim() && !sendM.isPending) sendM.mutate();
            }
          }}
          rows={1}
          placeholder="Type a message"
          className="flex-1 resize-none max-h-32 rounded-2xl bg-muted/60 px-4 py-2.5 text-sm outline-none focus:bg-muted"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sendM.isPending}
          className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50 shrink-0"
          aria-label="Send"
        >
          {sendM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
