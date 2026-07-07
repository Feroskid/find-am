import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Send, Loader2, Briefcase, ArrowRightLeft } from "lucide-react";
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
    <div className="fixed inset-0 flex flex-col bg-[#0b141a]">
      {/* Header — WhatsApp style */}
      <header className="flex items-center gap-2 px-2 py-2 border-b border-black/40 bg-[#202c33] text-white">
        <Link to="/messages" className="p-2 rounded-full hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold shrink-0">
          {initials(otherName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate leading-tight">{otherName}</div>
          <div className="text-[11px] text-white/60 truncate leading-tight">
            {task?.title ?? "Task"}
          </div>
        </div>
        <Link
          to="/tasks/$taskId/workspace"
          params={{ taskId }}
          className="inline-flex items-center gap-1.5 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow"
          title="Switch to task workspace"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          <span>Switch to task</span>
        </Link>
      </header>

      {/* Messages — WhatsApp pattern bg */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-2 py-3"
        style={{
          backgroundColor: "#0b141a",
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "22px 22px, 44px 44px",
          backgroundPosition: "0 0, 11px 11px",
        }}
      >
        {msgsQ.isLoading ? (
          <div className="flex items-center justify-center py-10 text-white/60 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : raw.length === 0 ? (
          <div className="text-center text-white/60 py-20 text-sm">
            No messages yet. Send the first one below.
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-1">
            {grouped.map((g) => (
              <div key={g.day}>
                <div className="flex justify-center my-3">
                  <span className="text-[11px] font-medium bg-[#182229] text-white/70 px-2.5 py-1 rounded-md shadow">
                    {g.day}
                  </span>
                </div>
                {g.items.map((m) => {
                  const k = String(m.message_id ?? m.id ?? `${m.created_at}-${m.sender_id}`);
                  const mine = String(m.sender_id ?? m.user_id) === String(myId);
                  const text = decrypted[k] ?? "…";
                  return (
                    <div key={k} className={`flex mb-0.5 ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`relative max-w-[78%] px-2.5 py-1.5 pr-14 shadow text-[14.5px] leading-snug break-words ${
                          mine
                            ? "bg-[#005c4b] text-white rounded-lg rounded-tr-none"
                            : "bg-[#202c33] text-white rounded-lg rounded-tl-none"
                        }`}
                      >
                        {/* Tail */}
                        <span
                          className={`absolute top-0 w-0 h-0 border-solid ${
                            mine
                              ? "right-[-6px] border-t-[#005c4b] border-t-8 border-l-transparent border-l-8"
                              : "left-[-6px] border-t-[#202c33] border-t-8 border-r-transparent border-r-8"
                          }`}
                        />
                        <div className="whitespace-pre-wrap">{text}</div>
                        <div className="absolute bottom-1 right-2 text-[10px] text-white/60">
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

      {/* Composer — WhatsApp style */}
      <form
        onSubmit={(e) => { e.preventDefault(); if (draft.trim() && !sendM.isPending) sendM.mutate(); }}
        className="flex items-end gap-2 px-2 py-2 bg-[#202c33]"
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
          placeholder="Message"
          className="flex-1 resize-none max-h-32 rounded-full bg-[#2a3942] text-white placeholder:text-white/50 px-4 py-2.5 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sendM.isPending}
          className="grid h-11 w-11 place-items-center rounded-full bg-emerald-600 text-white disabled:opacity-50 shrink-0 hover:bg-emerald-500"
          aria-label="Send"
        >
          {sendM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
