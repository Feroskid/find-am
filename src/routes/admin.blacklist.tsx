import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Ban, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminBlacklistBvn, adminUnblacklistBvn } from "@/lib/findtask.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/blacklist")({
  component: AdminBlacklistPage,
});

function AdminBlacklistPage() {
  const { token } = useAuth();
  const [bvn, setBvn] = useState("");
  const [reason, setReason] = useState("");
  const addFn = useServerFn(adminBlacklistBvn);
  const rmFn = useServerFn(adminUnblacklistBvn);

  const add = useMutation({
    mutationFn: () => addFn({ data: { bvn_hash: bvn, reason, token: token! } }),
    onSuccess: (r: any) => r.ok ? (toast.success("BVN blacklisted"), setBvn(""), setReason("")) : toast.error(r.error),
  });
  const rm = useMutation({
    mutationFn: () => rmFn({ data: { bvn_hash: bvn, token: token! } }),
    onSuccess: (r: any) => r.ok ? (toast.success("BVN removed from blacklist"), setBvn("")) : toast.error(r.error),
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="font-display text-xl text-ink flex items-center gap-2"><Ban className="h-5 w-5 text-primary" /> BVN Blacklist</h2>
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div>
          <label className="text-xs font-semibold uppercase text-muted-foreground">BVN hash</label>
          <input value={bvn} onChange={(e) => setBvn(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-muted-foreground">Reason (required for blacklist)</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-2">
          <button disabled={!bvn || !reason || add.isPending} onClick={() => add.mutate()} className="inline-flex items-center gap-1 rounded-lg bg-destructive text-destructive-foreground px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
            {add.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />} Blacklist BVN
          </button>
          <button disabled={!bvn || rm.isPending} onClick={() => rm.mutate()} className="inline-flex items-center gap-1 rounded-lg bg-muted text-foreground px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
            {rm.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Remove blacklist
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Complies with data laws — reason is stored alongside the BVN hash for audit.</p>
      </div>
    </div>
  );
}
