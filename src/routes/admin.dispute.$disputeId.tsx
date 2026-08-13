import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, ArrowLeft, Send, ShieldCheck, FileText, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { adminDisputeRooms, adminSendDisputeMessage, adminTaskThreads } from "@/lib/findtask.functions";

export const Route = createFileRoute("/admin/dispute/$disputeId")({
  head: () => ({ meta: [{ title: "Dispute rooms — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminDisputeRoomsPage,
});

function when(iso?: string) {
  return iso ? new Date(iso).toLocaleString() : "";
}

function Bubble({ m }: { m: any }) {
  const admin = m.sender_is_admin === 1 || m.sender_is_admin === true;
  return (
    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${admin ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
      <div className={`text-[10px] font-bold uppercase tracking-wider ${admin ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        {admin ? "Support" : (m.sender_name ?? "Party")}
        {m.is_read === 0 && !admin ? " · unread" : ""}
      </div>
      <div className="mt-0.5 whitespace-pre-wrap">{m.message_text}</div>
      {m.attachment_url && (
        <a href={m.attachment_url} target="_blank" rel="noreferrer" className="mt-1 block underline text-xs">
          View attachment
        </a>
      )}
      <div className={`mt-1 text-[10px] ${admin ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{when(m.created_at)}</div>
    </div>
  );
}

function Pane({
  title,
  partyId,
  messages,
  closed,
  onSend,
  sending,
}: {
  title: string;
  partyId?: string | null;
  messages: any[];
  closed: boolean;
  onSend: (partyId: string, text: string) => void;
  sending: boolean;
}) {
  const [text, setText] = useState("");
  return (
    <div className="rounded-2xl border border-border bg-card flex flex-col min-h-[420px]">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-semibold text-ink inline-flex items-center gap-1.5">
          <Users className="h-4 w-4 text-primary" /> {title}
        </h3>
        <p className="text-[11px] text-muted-foreground">Private room — the other party cannot see this.</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4 max-h-[50vh]">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet. The room becomes visible to this party once you send the first message.</p>
        ) : (
          messages.map((m: any) => <Bubble key={String(m.message_id ?? m.id)} m={m} />)
        )}
      </div>
      {closed ? (
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">This dispute has been resolved — the room is read-only.</div>
      ) : (
        <div className="border-t border-border p-3 flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder={`Message the ${title.toLowerCase()}…`}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            disabled={!partyId || sending || text.trim().length < 1}
            onClick={() => {
              onSend(String(partyId), text.trim());
              setText("");
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
          </button>
        </div>
      )}
    </div>
  );
}

function AdminDisputeRoomsPage() {
  const { disputeId } = Route.useParams();
  const { token } = useAuth();
  const roomsFn = useServerFn(adminDisputeRooms);
  const sendFn = useServerFn(adminSendDisputeMessage);
  const threadsFn = useServerFn(adminTaskThreads);
  const [showEvidence, setShowEvidence] = useState(false);

  const roomsQ = useQuery({
    queryKey: ["admin", "dispute-rooms", disputeId, token],
    enabled: !!token,
    queryFn: () => roomsFn({ data: { disputeId, token: token! } }),
    refetchInterval: 20_000,
  });

  const rooms: any = roomsQ.data?.ok ? roomsQ.data.data : null;
  const taskId = rooms?.task_id;

  const evidenceQ = useQuery({
    queryKey: ["admin", "task-threads", taskId, token],
    enabled: !!token && !!taskId && showEvidence,
    queryFn: () => threadsFn({ data: { taskId: String(taskId), token: token! } }),
  });
  const evidence: any = evidenceQ.data?.ok ? evidenceQ.data.data : null;

  const sendM = useMutation({
    mutationFn: (v: { partyId: string; text: string }) =>
      sendFn({ data: { disputeId, room_party_id: v.partyId, message_text: v.text, token: token! } }),
    onSuccess: (r: any) => {
      if (r?.ok) roomsQ.refetch();
      else toast.error(r?.error ?? "Could not send message");
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/disputes" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to disputes
          </Link>
          <h2 className="font-display text-2xl text-ink inline-flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Dispute #{disputeId}
          </h2>
          <p className="text-sm text-muted-foreground">
            {rooms?.task_title ? `Task #${rooms.task_id} · ${rooms.task_title}` : "Private rooms with each party"}
            {rooms?.closed ? " · resolved" : ""}
          </p>
        </div>
        {taskId && (
          <button
            onClick={() => setShowEvidence((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            <FileText className="h-4 w-4" /> {showEvidence ? "Hide" : "View"} task thread (evidence)
          </button>
        )}
      </div>

      {roomsQ.isPending ? (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading rooms…</div>
      ) : !roomsQ.data?.ok ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {(roomsQ.data as any)?.error ?? "Could not load this dispute."}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Pane
            title="Poster"
            partyId={rooms?.poster_room?.party_id}
            messages={rooms?.poster_room?.messages ?? []}
            closed={!!rooms?.closed}
            sending={sendM.isPending}
            onSend={(partyId, text) => sendM.mutate({ partyId, text })}
          />
          <Pane
            title="Tasker"
            partyId={rooms?.tasker_room?.party_id}
            messages={rooms?.tasker_room?.messages ?? []}
            closed={!!rooms?.closed}
            sending={sendM.isPending}
            onSend={(partyId, text) => sendM.mutate({ partyId, text })}
          />
        </div>
      )}

      {showEvidence && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-semibold text-ink">Task conversation (read-only evidence)</h3>
          <p className="text-[11px] text-muted-foreground">Every view of this thread is written to the audit log.</p>
          {evidenceQ.isPending ? (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading thread…</div>
          ) : !evidence ? (
            <div className="mt-3 text-sm text-destructive">{(evidenceQ.data as any)?.error ?? "Could not load the task thread."}</div>
          ) : (
            <div className="mt-3 space-y-4">
              {(evidence.threads ?? []).map((t: any, i: number) => (
                <div key={i} className="rounded-xl border border-border p-3">
                  <div className="text-xs font-semibold text-muted-foreground">Thread with tasker {t.tasker_id}</div>
                  <div className="mt-2 space-y-1.5">
                    {(t.messages ?? []).map((m: any, j: number) => (
                      <div key={j} className="text-sm">
                        <span className="font-semibold">{m.sender_name ?? "User"}</span>
                        <span className="text-[11px] text-muted-foreground"> · {when(m.created_at)}</span>
                        <div className="whitespace-pre-wrap">{m.message_text}</div>
                        {m.attachment_url && (
                          <a href={m.attachment_url} target="_blank" rel="noreferrer" className="text-xs underline text-primary">attachment</a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
