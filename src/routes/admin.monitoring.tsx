import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Radar, MessageSquareWarning, UserX } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { adminFlaggedAccounts, adminFlaggedMessages } from "@/lib/findtask.functions";

export const Route = createFileRoute("/admin/monitoring")({
  head: () => ({ meta: [{ title: "Monitoring — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminMonitoringPage,
});

function toList(d: any, ...keys: string[]): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  for (const k of keys) if (Array.isArray(d[k])) return d[k];
  return d.results ?? d.data ?? [];
}

function AdminMonitoringPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<"accounts" | "messages">("accounts");
  const [msgStatus, setMsgStatus] = useState("open");
  const accFn = useServerFn(adminFlaggedAccounts);
  const msgFn = useServerFn(adminFlaggedMessages);

  const accQ = useQuery({
    queryKey: ["admin", "flagged-accounts", token],
    enabled: !!token && tab === "accounts",
    queryFn: () => accFn({ data: { token: token! } }),
  });
  const msgQ = useQuery({
    queryKey: ["admin", "flagged-messages", msgStatus, token],
    enabled: !!token && tab === "messages",
    queryFn: () => msgFn({ data: { token: token!, status: msgStatus } }),
  });

  const accountsRaw: any = accQ.data?.ok ? accQ.data.data : null;
  const employers = toList(accountsRaw?.employers ?? accountsRaw?.flagged_employers, "employers");
  const taskers = toList(accountsRaw?.taskers ?? accountsRaw?.flagged_taskers, "taskers");
  const flatAccounts = employers.length || taskers.length ? [] : toList(accountsRaw, "accounts", "flagged", "users");
  const messages = msgQ.data?.ok ? toList(msgQ.data.data, "messages", "flagged_messages") : [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-ink inline-flex items-center gap-2"><Radar className="h-5 w-5 text-primary" /> Monitoring</h2>
        <p className="text-sm text-muted-foreground">Live risk queues: accounts worth a look and messages the filter caught.</p>
      </div>

      <div className="flex gap-1 rounded-full border border-border bg-card p-1 w-fit">
        {(["accounts", "messages"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "accounts" ? "Flagged accounts" : "Flagged messages"}
          </button>
        ))}
      </div>

      {tab === "accounts" ? (
        accQ.isPending ? (
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Scanning accounts…</div>
        ) : !accQ.data?.ok ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(accQ.data as any)?.error}</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <AccountList title="Flagged posters" rows={employers.length ? employers : flatAccounts} />
            <AccountList title="Flagged taskers" rows={taskers} />
          </div>
        )
      ) : (
        <div className="space-y-3">
          <select value={msgStatus} onChange={(e) => setMsgStatus(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm">
            <option value="open">Open</option>
            <option value="reviewed">Reviewed</option>
            <option value="all">All</option>
          </select>
          {msgQ.isPending ? (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading flagged messages…</div>
          ) : !msgQ.data?.ok ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(msgQ.data as any)?.error}</div>
          ) : messages.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Nothing flagged right now.</div>
          ) : (
            <ul className="space-y-2">
              {messages.map((m: any, i: number) => (
                <li key={String(m.message_id ?? m.id ?? i)} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                      <MessageSquareWarning className="h-3.5 w-3.5 text-amber-500" />
                      Task #{m.task_id ?? "—"} · {m.sender_name ?? m.sender_id ?? "user"}
                      {m.created_at ? ` · ${new Date(m.created_at).toLocaleString()}` : ""}
                    </div>
                    {m.keyword && <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">{m.keyword}</span>}
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{m.message_text ?? m.body}</p>
                  {m.task_id != null && (
                    <Link to="/tasks/$taskId" params={{ taskId: String(m.task_id) }} className="mt-2 inline-block text-xs text-primary underline">
                      View task
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function AccountList({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-semibold text-ink inline-flex items-center gap-1.5"><UserX className="h-4 w-4 text-primary" /> {title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nothing to review.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((u: any, i: number) => (
            <li key={String(u.user_id ?? u.id ?? i)} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{u.name ?? u.full_name ?? `User ${u.user_id ?? u.id}`}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{u.email ?? u.user_id ?? u.id}</div>
                </div>
                {(u.user_id ?? u.id) != null && (
                  <Link to="/u/$userId" params={{ userId: String(u.user_id ?? u.id) }} className="text-xs text-primary underline shrink-0">
                    Profile
                  </Link>
                )}
              </div>
              {(u.reasons ?? u.flags ?? u.reason) && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {Array.isArray(u.reasons ?? u.flags) ? (u.reasons ?? u.flags).join(" · ") : String(u.reason ?? "")}
                </p>
              )}
              {(u.disputes ?? u.cancelled_tasks ?? u.dispute_count) != null && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  disputes: {u.disputes ?? u.dispute_count ?? 0} · cancellations: {u.cancelled_tasks ?? 0}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
