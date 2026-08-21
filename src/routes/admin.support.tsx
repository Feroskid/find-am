import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, LifeBuoy, Send, CheckCircle2, Clock, Inbox } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { adminListTickets, adminGetTicket, adminReplyTicket, adminUpdateTicket } from "@/lib/support.functions";

export const Route = createFileRoute("/admin/support")({
  head: () => ({ meta: [{ title: "Support inbox — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminSupport,
});

const STATUSES = ["open", "closed", "all"] as const;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    closed: "bg-muted text-muted-foreground",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${map[status] ?? "bg-muted text-muted-foreground"}`}>{status}</span>;
}

function AdminSupport() {
  const { token } = useAuth();
  const listFn = useServerFn(adminListTickets);
  const getFn = useServerFn(adminGetTicket);
  const replyFn = useServerFn(adminReplyTicket);
  const updateFn = useServerFn(adminUpdateTicket);

  const [status, setStatus] = useState<(typeof STATUSES)[number]>("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const listQ = useQuery({
    queryKey: ["admin", "tickets", status, token],
    enabled: !!token,
    queryFn: () => listFn({ data: { token: token!, status } }),
  });

  const threadQ = useQuery({
    queryKey: ["admin", "ticket", openId, token],
    enabled: !!token && !!openId,
    queryFn: () => getFn({ data: { token: token!, ticketId: openId! } }),
  });

  const replyM = useMutation({
    mutationFn: () => replyFn({ data: { token: token!, ticketId: openId!, body: reply.trim() } }),
    onSuccess: (r: any) => {
      if (r?.ok) { toast.success("Reply saved"); setReply(""); threadQ.refetch(); listQ.refetch(); }
      else toast.error(r?.error ?? "Could not send reply");
    },
  });

  const updateM = useMutation({
    mutationFn: (vars: { status?: "open" | "closed"; priority?: "low" | "normal" | "high" | "urgent" }) =>
      updateFn({ data: { token: token!, ticketId: openId!, ...vars } }),
    onSuccess: (r: any) => {
      if (r?.ok) { toast.success("Ticket updated"); threadQ.refetch(); listQ.refetch(); }
      else toast.error(r?.error ?? "Could not update ticket");
    },
  });

  const tickets: any[] = (listQ.data as any)?.ok ? ((listQ.data as any).tickets ?? []) : [];
  const counts: any = (listQ.data as any)?.ok ? (listQ.data as any).counts : null;
  const thread: any = (threadQ.data as any)?.ok ? threadQ.data : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink inline-flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-primary" /> Support inbox
          </h2>
          <p className="text-sm text-muted-foreground">Customer support requests from the contact page.</p>
        </div>
        {counts && (
          <div className="flex gap-2 text-xs">
            <span className="rounded-full bg-amber-500/15 px-3 py-1 font-semibold text-amber-700 dark:text-amber-300 inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {counts.open} open</span>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {counts.closed} closed</span>
            <span className="rounded-full bg-muted px-3 py-1 font-semibold text-muted-foreground inline-flex items-center gap-1"><Inbox className="h-3 w-3" /> {counts.total} total</span>
          </div>
        )}
      </div>

      <div className="flex gap-1 rounded-full border border-border bg-card p-1 w-fit">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setOpenId(null); }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize ${status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {listQ.isPending ? (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading tickets…</div>
      ) : !(listQ.data as any)?.ok ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(listQ.data as any)?.error ?? "Could not load tickets"}</div>
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No {status === "all" ? "" : status} tickets right now.</div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,380px)_1fr] items-start">
          <div className="space-y-2">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => { setOpenId(t.id); setReply(""); }}
                className={`w-full text-left rounded-xl border p-3.5 transition ${openId === t.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm truncate">{t.subject}</span>
                  <StatusBadge status={t.status} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground truncate">{t.name} · {t.email}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {t.category} · {new Date(t.created_at).toLocaleString()}
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 min-h-[220px]">
            {!openId ? (
              <p className="text-sm text-muted-foreground">Select a ticket to read and reply.</p>
            ) : threadQ.isPending ? (
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
            ) : !thread ? (
              <div className="text-sm text-destructive">{(threadQ.data as any)?.error ?? "Could not load ticket"}</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{thread.ticket?.subject}</h3>
                    <StatusBadge status={thread.ticket?.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {thread.ticket?.name} · <a className="underline" href={`mailto:${thread.ticket?.email}`}>{thread.ticket?.email}</a>
                    {thread.ticket?.user_ref ? ` · user ${thread.ticket.user_ref}` : ""}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-sm whitespace-pre-wrap">{thread.ticket?.message}</div>

                {thread.messages.length > 0 && (
                  <div className="space-y-2">
                    {thread.messages.map((m: any) => (
                      <div key={m.id} className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                        <div className="text-[11px] font-semibold text-primary">{m.author_name ?? "Admin"} · {new Date(m.created_at).toLocaleString()}</div>
                        <div className="mt-1 text-sm whitespace-pre-wrap">{m.body}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={4}
                    placeholder="Write your reply to this user…"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => reply.trim().length >= 2 && replyM.mutate()}
                      disabled={replyM.isPending || reply.trim().length < 2}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      {replyM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Save reply
                    </button>
                    <a
                      href={`mailto:${thread.ticket?.email}?subject=${encodeURIComponent(`Re: ${thread.ticket?.subject ?? ""}`)}&body=${encodeURIComponent(reply)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                    >
                      Email the user
                    </a>
                    <button
                      onClick={() => updateM.mutate({ status: "closed" })}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                    >
                      Close ticket
                    </button>
                    <button
                      onClick={() => updateM.mutate({ status: "open", priority: "urgent" })}
                      className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 text-destructive px-4 py-2 text-sm font-semibold hover:bg-destructive/10"
                    >
                      Flag urgent
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
