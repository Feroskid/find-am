import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessagesSquare, ScrollText, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ModerationQueue } from "@/components/community/ModerationQueue";
import { RolesPanel } from "@/components/community/RolesPanel";
import { CommunityUserPanel } from "@/components/admin/CommunityUserPanel";
import { listCommunityRoles } from "@/lib/community.functions";
import { listCommunityActions } from "@/lib/community-log.functions";

export const Route = createFileRoute("/admin/community")({
  head: () => ({ meta: [{ title: "Community — Find-am Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminCommunityPage,
});

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink">{value}</div>
    </div>
  );
}

function ActionLog({ token }: { token: string }) {
  const fn = useServerFn(listCommunityActions);
  const [actor, setActor] = useState("");
  const [applied, setApplied] = useState("");
  const q = useQuery({
    queryKey: ["admin", "community-actions", applied, token],
    queryFn: () => fn({ data: { token, actor: applied || undefined, limit: 300 } }),
  });
  const rows: any[] = (q.data as any)?.ok ? (q.data as any).rows : [];
  const err = (q.data as any) && !(q.data as any).ok ? (q.data as any).error : null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-ink inline-flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-primary" /> Moderator activity
      </h3>
      <p className="text-xs text-muted-foreground">
        Every community action taken through Find-am — who did it, what they did and when.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setApplied(actor.trim().replace(/^@/, ""));
        }}
        className="flex gap-2"
      >
        <input
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          placeholder="Filter by moderator username (optional)"
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm"
        />
        <button className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold">
          <Search className="h-3.5 w-3.5" /> Search
        </button>
      </form>

      {q.isLoading ? (
        <div className="flex justify-center py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></div>
      ) : err ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{err}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No community actions recorded yet.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Moderator</th>
                <th className="text-left px-3 py-2">Level</th>
                <th className="text-left px-3 py-2">Action</th>
                <th className="text-left px-3 py-2">Target</th>
                <th className="text-left px-3 py-2">Note</th>
                <th className="text-left px-3 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{r.actor_display ?? r.actor_username}</td>
                  <td className="px-3 py-2 text-xs capitalize">{String(r.actor_level ?? "").replace("_", " ")}</td>
                  <td className="px-3 py-2 font-medium">{String(r.action).replace(/_/g, " ")}</td>
                  <td className="px-3 py-2 text-xs">
                    {r.target_username ? `@${r.target_username}` : `${r.target_type} ${r.target_id ?? ""}`}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground max-w-xs truncate">{r.reason ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const TABS = ["queue", "team", "match", "activity"] as const;
const LABELS: Record<(typeof TABS)[number], string> = {
  queue: "Report queue",
  team: "Moderator team",
  match: "Community ↔ Find-am",
  activity: "Activity record",
};

function AdminCommunityPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("queue");
  const rolesFn = useServerFn(listCommunityRoles);

  const rolesQ = useQuery({
    queryKey: ["admin", "community-roles", token],
    enabled: !!token,
    retry: false,
    queryFn: () => rolesFn({ data: { token: token! } }),
  });

  const rolePayload: any = (rolesQ.data as any)?.ok ? (rolesQ.data as any).data : null;
  const roleRows: any[] = rolePayload?.roles ?? rolePayload?.members ?? rolePayload?.items ?? (Array.isArray(rolePayload) ? rolePayload : []);
  const mods = roleRows.filter((r) => (r.role ?? r.level) !== "super_moderator").length;
  const supers = roleRows.filter((r) => (r.role ?? r.level) === "super_moderator").length;

  if (!token) return null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl text-ink flex items-center gap-2">
          <MessagesSquare className="h-5 w-5 text-primary" /> Community
        </h2>
        <p className="text-sm text-muted-foreground">
          Reports, moderator access, account matching and the record of what moderators have done.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Moderators" value={rolesQ.isPending ? "…" : mods} />
        <Stat label="Super moderators" value={rolesQ.isPending ? "…" : supers} />
        <Stat label="Role holders" value={rolesQ.isPending ? "…" : roleRows.length} />
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "queue" && (
        <div className="community-scope rounded-2xl border border-border p-4">
          <ModerationQueue token={token} fallbackSuper />
        </div>
      )}
      {tab === "team" && (
        <div className="community-scope rounded-2xl border border-border p-4">
          <RolesPanel token={token} />
        </div>
      )}
      {tab === "match" && <CommunityUserPanel token={token} />}
      {tab === "activity" && <ActionLog token={token} />}
    </div>
  );
}
