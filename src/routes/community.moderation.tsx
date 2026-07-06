import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Shield, Check, X, Lock, Unlock, Pin, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CommunityShell } from "@/components/community/CommunityShell";
import { listReportsByStatus, resolveReport, moderateThread, getReportTarget } from "@/lib/community.functions";

export const Route = createFileRoute("/community/moderation")({
  head: () => ({ meta: [{ title: "Moderation — Find-Task Community" }] }),
  component: ModPage,
});

const TABS = [
  { id: "open" as const, label: "Open" },
  { id: "resolved" as const, label: "Resolved" },
  { id: "dismissed" as const, label: "Dismissed" },
];

function ModPage() {
  const listFn = useServerFn(listReportsByStatus);
  const resFn = useServerFn(resolveReport);
  const modFn = useServerFn(moderateThread);
  const [tab, setTab] = useState<"open" | "resolved" | "dismissed">("open");
  const q = useQuery({ queryKey: ["community-reports", tab], queryFn: () => listFn({ data: { status: tab } }) });

  const resolve = useMutation({
    mutationFn: (v: { reportId: string; status: "resolved" | "dismissed" }) => resFn({ data: v }),
    onSuccess: (r) => { r.ok ? toast.success("Report updated") : toast.error(r.error); q.refetch(); },
  });
  const modAction = useMutation({
    mutationFn: (v: { threadId: string; action: "lock" | "unlock" | "pin" | "unpin" | "delete" }) => modFn({ data: v }),
    onSuccess: (r) => r.ok ? toast.success("Action applied") : toast.error(r.error),
  });

  if (q.data && !q.data.ok && q.data.error === "Forbidden") {
    return (
      <CommunityShell>
        <div className="text-center py-16">
          <Shield className="h-12 w-12 mx-auto text-black/20 mb-3" />
          <p className="text-sm text-black/60">You don't have moderator access.</p>
        </div>
      </CommunityShell>
    );
  }

  const reports: any[] = q.data?.ok ? q.data.data : [];

  return (
    <CommunityShell>
      <h1 className="font-bold text-2xl mb-4 inline-flex items-center gap-2"><Shield className="h-5 w-5" /> Moderation</h1>

      <div className="flex gap-1 border-b border-black/10 mb-4">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${tab === t.id ? "border-[#E5A54B] text-[#E5A54B]" : "border-transparent text-black/60 hover:text-black"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <div className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin inline text-black/40" /></div>
      ) : reports.length === 0 ? (
        <p className="text-sm text-black/50 text-center py-12">
          {tab === "open" ? "No open reports 🎉" : `No ${tab} reports.`}
        </p>
      ) : (
        <ul className="space-y-3">
          {reports.map((r: any) => (
            <ReportCard key={r.id} r={r} onResolve={resolve.mutate} onMod={modAction.mutate} />
          ))}
        </ul>
      )}
    </CommunityShell>
  );
}

function ReportCard({ r, onResolve, onMod }: any) {
  const getFn = useServerFn(getReportTarget);
  const [expanded, setExpanded] = useState(false);
  const tq = useQuery({
    queryKey: ["report-target", r.target_type, r.target_id, expanded],
    enabled: expanded,
    queryFn: () => getFn({ data: { targetType: r.target_type, targetId: r.target_id } }),
  });

  const target = tq.data?.ok ? (tq.data.data as any).target : null;

  return (
    <li className="rounded-xl bg-white border border-black/10 p-4">
      <div className="flex items-center justify-between text-xs text-black/50">
        <span>{new Date(r.created_at).toLocaleString()} · <span className="uppercase font-semibold">{r.target_type}</span></span>
        <span className={`px-2 py-0.5 rounded font-semibold ${
          r.status === "open" ? "bg-orange-100 text-orange-800" :
          r.status === "resolved" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"
        }`}>{r.status}</span>
      </div>
      <div className="text-sm mt-2 text-black/80">{r.reason}</div>

      <button onClick={() => setExpanded((v) => !v)} className="mt-2 text-xs text-[#E5A54B] font-semibold hover:underline">
        {expanded ? "Hide target" : "Show target"}
      </button>

      {expanded && (
        <div className="mt-2 rounded-lg bg-black/[0.03] p-3 text-sm">
          {tq.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> :
           !target ? <span className="text-black/50 italic">Target not available</span> :
           r.target_type === "thread" ? (
             <>
               <div className="font-semibold">{target.title}</div>
               <div className="text-xs text-black/60 mt-1 line-clamp-3">{target.body_md}</div>
             </>
           ) : r.target_type === "post" ? (
             <div className="text-xs text-black/70 line-clamp-4">{target.body_md}</div>
           ) : (
             <div>@{target.username} · {target.rank} · {target.points} pts</div>
           )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {r.target_type === "thread" && r.status === "open" && (
          <>
            <button onClick={() => onMod({ threadId: r.target_id, action: "lock" })} className="text-xs inline-flex items-center gap-1 rounded bg-black/5 px-2 py-1 hover:bg-black/10"><Lock className="h-3 w-3" /> Lock</button>
            <button onClick={() => onMod({ threadId: r.target_id, action: "unlock" })} className="text-xs inline-flex items-center gap-1 rounded bg-black/5 px-2 py-1 hover:bg-black/10"><Unlock className="h-3 w-3" /> Unlock</button>
            <button onClick={() => onMod({ threadId: r.target_id, action: "pin" })} className="text-xs inline-flex items-center gap-1 rounded bg-black/5 px-2 py-1 hover:bg-black/10"><Pin className="h-3 w-3" /> Pin</button>
            <button onClick={() => onMod({ threadId: r.target_id, action: "delete" })} className="text-xs inline-flex items-center gap-1 rounded bg-red-100 text-red-700 px-2 py-1 hover:bg-red-200"><Trash2 className="h-3 w-3" /> Delete</button>
          </>
        )}
        {r.status === "open" && (
          <>
            <button onClick={() => onResolve({ reportId: r.id, status: "resolved" })} className="ml-auto inline-flex items-center gap-1 text-xs rounded bg-emerald-100 text-emerald-800 px-2 py-1 hover:bg-emerald-200"><Check className="h-3 w-3" /> Resolve</button>
            <button onClick={() => onResolve({ reportId: r.id, status: "dismissed" })} className="inline-flex items-center gap-1 text-xs rounded bg-black/5 px-2 py-1 hover:bg-black/10"><X className="h-3 w-3" /> Dismiss</button>
          </>
        )}
      </div>
    </li>
  );
}
