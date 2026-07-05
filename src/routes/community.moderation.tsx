import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, Check, X } from "lucide-react";
import { toast } from "sonner";
import { CommunityShell } from "@/components/community/CommunityShell";
import { listOpenReports, resolveReport, moderateThread } from "@/lib/community.functions";

export const Route = createFileRoute("/community/moderation")({
  head: () => ({ meta: [{ title: "Moderation — Find-Task Community" }] }),
  component: ModPage,
});

function ModPage() {
  const listFn = useServerFn(listOpenReports);
  const resFn = useServerFn(resolveReport);
  const modFn = useServerFn(moderateThread);
  const q = useQuery({ queryKey: ["community-reports"], queryFn: () => listFn() });
  const resolve = useMutation({
    mutationFn: (v: { reportId: string; status: "resolved" | "dismissed" }) => resFn({ data: v }),
    onSuccess: (r) => { r.ok ? toast.success("Report updated") : toast.error(r.error); q.refetch(); },
  });
  const modAction = useMutation({
    mutationFn: (v: { threadId: string; action: "lock" | "delete" | "pin" }) => modFn({ data: v }),
    onSuccess: (r) => { r.ok ? toast.success("Action applied") : toast.error(r.error); },
  });

  if (q.data && !q.data.ok) return <CommunityShell><p className="text-sm text-red-600">You do not have moderator access.</p></CommunityShell>;

  return (
    <CommunityShell>
      <h1 className="font-bold text-2xl mb-4 inline-flex items-center gap-2"><Shield className="h-5 w-5" /> Open reports</h1>
      <ul className="space-y-2">
        {(q.data?.ok ? q.data.data : []).map((r: any) => (
          <li key={r.id} className="rounded-xl bg-white border border-black/10 p-4">
            <div className="text-xs text-black/50">{new Date(r.created_at).toLocaleString()} · {r.target_type}</div>
            <div className="text-sm mt-1">{r.reason}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.target_type === "thread" && (
                <>
                  <button onClick={() => modAction.mutate({ threadId: r.target_id, action: "lock" })} className="text-xs rounded bg-black/5 px-2 py-1 hover:bg-black/10">Lock thread</button>
                  <button onClick={() => modAction.mutate({ threadId: r.target_id, action: "delete" })} className="text-xs rounded bg-red-100 text-red-700 px-2 py-1 hover:bg-red-200">Delete thread</button>
                </>
              )}
              <button onClick={() => resolve.mutate({ reportId: r.id, status: "resolved" })} className="ml-auto inline-flex items-center gap-1 text-xs rounded bg-emerald-100 text-emerald-800 px-2 py-1"><Check className="h-3 w-3" /> Resolve</button>
              <button onClick={() => resolve.mutate({ reportId: r.id, status: "dismissed" })} className="inline-flex items-center gap-1 text-xs rounded bg-black/5 px-2 py-1"><X className="h-3 w-3" /> Dismiss</button>
            </div>
          </li>
        ))}
        {q.data?.ok && q.data.data.length === 0 && <p className="text-sm text-black/50">No open reports 🎉</p>}
      </ul>
    </CommunityShell>
  );
}
