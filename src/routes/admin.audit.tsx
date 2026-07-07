import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, ScrollText, Search } from "lucide-react";
import { adminAuditLog } from "@/lib/findtask.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAuditPage,
});

function AdminAuditPage() {
  const { token } = useAuth();
  const [targetId, setTargetId] = useState("");
  const [applied, setApplied] = useState("");
  const fn = useServerFn(adminAuditLog);
  const q = useQuery({
    queryKey: ["admin-audit", applied, token],
    enabled: !!token,
    queryFn: () => fn({ data: { token: token!, target_id: applied || undefined } }),
  });

  const rows: any[] = q.data?.ok ? ((q.data.data as any)?.logs ?? (q.data.data as any)?.results ?? (Array.isArray(q.data.data) ? q.data.data : [])) : [];
  const err = q.data && !q.data.ok ? q.data.error : null;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-ink flex items-center gap-2"><ScrollText className="h-5 w-5 text-primary" /> Audit log</h2>
      <form onSubmit={(e) => { e.preventDefault(); setApplied(targetId.trim()); }} className="flex gap-2">
        <input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="Filter by target ID (optional)" className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        <button className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold">
          <Search className="h-3.5 w-3.5" /> Search
        </button>
      </form>

      {q.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Loading log…</div>
      ) : err ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{err}</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No log entries.</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Log</th>
                <th className="text-left px-3 py-2">Admin</th>
                <th className="text-left px-3 py-2">Action</th>
                <th className="text-left px-3 py-2">Target</th>
                <th className="text-left px-3 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={String(r.log_id ?? r.id)} className="border-t border-border">
                  <td className="px-3 py-2 text-xs text-muted-foreground">#{r.log_id ?? r.id}</td>
                  <td className="px-3 py-2">{r.admin_name ?? r.admin_id}</td>
                  <td className="px-3 py-2 font-medium">{r.action}</td>
                  <td className="px-3 py-2 text-xs">{r.target_type} #{r.target_id}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
