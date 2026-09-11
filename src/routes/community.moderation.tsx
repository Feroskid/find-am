import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Shield, Check, X, Lock, Unlock, Pin, EyeOff, Eye, Loader2, Ban } from "lucide-react";
import { toast } from "sonner";
import { CommunityShell, AuthorChip } from "@/components/community/CommunityShell";
import {
  listModReports,
  resolveModReport,
  moderateThread,
  moderatePost,
  banMember,
  unbanMember,
} from "@/lib/community.functions";
import { useCommunityMe, communityError, relTime } from "@/lib/community-client";

export const Route = createFileRoute("/community/moderation")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Moderation — Find-Task Community" },
      { name: "description", content: "Review reports and take action on community content." },
    ],
  }),
  component: ModPage,
});

const TABS = ["open", "resolved", "dismissed"] as const;

function ModPage() {
  const c = useCommunityMe();
  const listFn = useServerFn(listModReports);
  const resFn = useServerFn(resolveModReport);
  const thrFn = useServerFn(moderateThread);
  const postFn = useServerFn(moderatePost);
  const banFn = useServerFn(banMember);
  const unbanFn = useServerFn(unbanMember);
  const [tab, setTab] = useState<(typeof TABS)[number]>("open");

  const q = useQuery({
    queryKey: ["community", "mod-reports", tab, c.token],
    enabled: !!c.token && c.canModerate,
    queryFn: () => listFn({ data: { token: c.token!, status: tab } }),
  });

  const resolve = useMutation({
    mutationFn: (v: { reportId: string; status: "resolved" | "dismissed" }) => resFn({ data: { token: c.token!, ...v } }),
    onSuccess: (r) => (r.ok ? (toast.success("Report updated"), q.refetch()) : toast.error(communityError(r))),
  });
  const threadAction = useMutation({
    mutationFn: (v: { threadId: string; action: "hide" | "unhide" | "pin" | "unpin" | "lock" | "unlock" }) =>
      thrFn({ data: { token: c.token!, ...v } }),
    onSuccess: (r) => (r.ok ? toast.success("Action applied") : toast.error(communityError(r))),
  });
  const postAction = useMutation({
    mutationFn: (v: { postId: string; action: "hide" | "unhide" }) => postFn({ data: { token: c.token!, ...v } }),
    onSuccess: (r) => (r.ok ? toast.success("Action applied") : toast.error(communityError(r))),
  });
  const ban = useMutation({
    mutationFn: (v: { username: string; on: boolean }) =>
      v.on ? banFn({ data: { token: c.token!, username: v.username } }) : unbanFn({ data: { token: c.token!, username: v.username } }),
    onSuccess: (r) => (r.ok ? toast.success("Member updated") : toast.error(communityError(r))),
  });

  if (c.loading) {
    return <CommunityShell><div className="py-16 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-black/40" /></div></CommunityShell>;
  }

  if (!c.canModerate) {
    return (
      <CommunityShell>
        <div className="text-center py-16">
          <Shield className="h-12 w-12 mx-auto text-black/20 mb-3" />
          <p className="text-sm text-black/60">You don't have moderator access.</p>
          <Link to="/community" className="mt-3 inline-block text-sm text-[#E5A54B] font-semibold hover:underline">Back to the community</Link>
        </div>
      </CommunityShell>
    );
  }

  const payload: any = q.data?.ok ? q.data.data : null;
  const reports: any[] = payload?.reports ?? [];
  const level: string = payload?.level ?? (c.isSuperMod ? "super_moderator" : "moderator");

  return (
    <CommunityShell>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h1 className="font-bold text-2xl inline-flex items-center gap-2"><Shield className="h-5 w-5" /> Moderation</h1>
        <span className="text-xs font-semibold uppercase tracking-wider text-black/50">{level.replace("_", " ")}</span>
      </div>

      <div className="flex gap-1 border-b border-black/10 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px capitalize ${tab === t ? "border-[#E5A54B] text-[#E5A54B]" : "border-transparent text-black/60 hover:text-black"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <div className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin inline text-black/40" /></div>
      ) : !q.data?.ok ? (
        <p className="text-sm text-red-600 text-center py-10">{communityError(q.data as any)}</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-black/50 text-center py-12">{tab === "open" ? "No open reports 🎉" : `No ${tab} reports.`}</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="rounded-xl bg-white border border-black/10 p-4">
              <div className="flex items-center justify-between text-xs text-black/50 gap-2 flex-wrap">
                <span>{relTime(r.created_at)} · <span className="uppercase font-semibold">{r.target_type}</span></span>
                <span className={`px-2 py-0.5 rounded font-semibold ${r.status === "open" ? "bg-orange-100 text-orange-800" : r.status === "resolved" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}`}>
                  {r.status}
                </span>
              </div>

              <div className="text-sm mt-2 text-black/80">{r.reason}</div>

              <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-black/60">
                <span className="inline-flex items-center gap-1">Reported by <AuthorChip author={r.reporter} size={4} /></span>
                {r.target_user && <span className="inline-flex items-center gap-1">· About <AuthorChip author={r.target_user} size={4} /></span>}
                {r.target_type === "thread" && (
                  <Link to="/community/t/$threadId" params={{ threadId: String(r.target_id) }} search={{ page: 1 }} className="text-[#E5A54B] font-semibold hover:underline">
                    Open thread
                  </Link>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {r.target_type === "thread" && (
                  <>
                    {(["lock", "unlock", "pin", "unpin", "hide", "unhide"] as const).map((action) => (
                      <button
                        key={action}
                        onClick={() => threadAction.mutate({ threadId: String(r.target_id), action })}
                        className="text-xs inline-flex items-center gap-1 rounded bg-black/5 px-2 py-1 hover:bg-black/10 capitalize"
                      >
                        {action === "lock" && <Lock className="h-3 w-3" />}
                        {action === "unlock" && <Unlock className="h-3 w-3" />}
                        {action === "pin" && <Pin className="h-3 w-3" />}
                        {action === "unpin" && <Pin className="h-3 w-3" />}
                        {action === "hide" && <EyeOff className="h-3 w-3" />}
                        {action === "unhide" && <Eye className="h-3 w-3" />}
                        {action}
                      </button>
                    ))}
                  </>
                )}
                {r.target_type === "post" && (
                  <>
                    <button onClick={() => postAction.mutate({ postId: String(r.target_id), action: "hide" })} className="text-xs inline-flex items-center gap-1 rounded bg-black/5 px-2 py-1 hover:bg-black/10"><EyeOff className="h-3 w-3" /> Hide</button>
                    <button onClick={() => postAction.mutate({ postId: String(r.target_id), action: "unhide" })} className="text-xs inline-flex items-center gap-1 rounded bg-black/5 px-2 py-1 hover:bg-black/10"><Eye className="h-3 w-3" /> Unhide</button>
                  </>
                )}
                {c.isSuperMod && (r.target_user?.username || r.target_type === "user") && (
                  <button
                    onClick={() => ban.mutate({ username: r.target_user?.username ?? String(r.target_id), on: true })}
                    className="text-xs inline-flex items-center gap-1 rounded bg-red-100 text-red-700 px-2 py-1 hover:bg-red-200"
                  >
                    <Ban className="h-3 w-3" /> Suspend member
                  </button>
                )}
                {r.status === "open" && (
                  <>
                    <button onClick={() => resolve.mutate({ reportId: String(r.id), status: "resolved" })} className="ml-auto inline-flex items-center gap-1 text-xs rounded bg-emerald-100 text-emerald-800 px-2 py-1 hover:bg-emerald-200"><Check className="h-3 w-3" /> Resolve</button>
                    <button onClick={() => resolve.mutate({ reportId: String(r.id), status: "dismissed" })} className="inline-flex items-center gap-1 text-xs rounded bg-black/5 px-2 py-1 hover:bg-black/10"><X className="h-3 w-3" /> Dismiss</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </CommunityShell>
  );
}
