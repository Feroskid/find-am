import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, X, Lock, Unlock, Pin, EyeOff, Eye, Loader2, Ban, Search, User } from "lucide-react";
import { toast } from "sonner";
import { AuthorChip, RankBadge, Badges } from "@/components/community/CommunityShell";
import {
  listModReports,
  resolveModReport,
  moderateThread,
  moderatePost,
  banMember,
  unbanMember,
  getCommunityProfile,
} from "@/lib/community.functions";
import { logCommunityAction } from "@/lib/community-log.functions";
import { avatarUrl } from "@/lib/community-avatars";
import { communityError, relTime } from "@/lib/community-client";

const TABS = ["open", "resolved", "dismissed"] as const;
export type ModTab = (typeof TABS)[number];

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white border border-black/10 p-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-black/50">{label}</div>
      <div className="mt-0.5 text-xl font-bold">{value}</div>
    </div>
  );
}

/**
 * The report queue, member lookup and summary tiles. Shared by the community
 * Moderation dashboard and the admin console so both show the same thing.
 * Every action taken here is recorded for admins.
 */
export function ModerationQueue({
  token,
  fallbackSuper = false,
}: {
  token: string;
  /** Treat the viewer as a super moderator when the service doesn't say. */
  fallbackSuper?: boolean;
}) {
  const listFn = useServerFn(listModReports);
  const resFn = useServerFn(resolveModReport);
  const thrFn = useServerFn(moderateThread);
  const postFn = useServerFn(moderatePost);
  const banFn = useServerFn(banMember);
  const unbanFn = useServerFn(unbanMember);
  const profileFn = useServerFn(getCommunityProfile);
  const logFn = useServerFn(logCommunityAction);

  const [tab, setTab] = useState<ModTab>("open");
  const [lookup, setLookup] = useState("");
  const [lookupFor, setLookupFor] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["community", "mod-reports", tab, token],
    retry: false,
    queryFn: () => listFn({ data: { token, status: tab } }),
  });

  const memberQ = useQuery({
    queryKey: ["community", "mod-member", lookupFor, token],
    enabled: !!lookupFor,
    retry: false,
    queryFn: () => profileFn({ data: { username: lookupFor!, token } }),
  });

  const record = (v: {
    action: string;
    target_type: "thread" | "post" | "member" | "report";
    target_id?: string;
    target_username?: string;
  }) => void logFn({ data: { token, ...v } });

  const resolve = useMutation({
    mutationFn: (v: { reportId: string; status: "resolved" | "dismissed" }) => resFn({ data: { token, ...v } }),
    onSuccess: (r: any, v) => {
      if (!r.ok) return toast.error(communityError(r));
      toast.success("Report updated");
      record({ action: v.status === "resolved" ? "resolve_report" : "dismiss_report", target_type: "report", target_id: v.reportId });
      q.refetch();
    },
  });
  const threadAction = useMutation({
    mutationFn: (v: { threadId: string; action: "hide" | "unhide" | "pin" | "unpin" | "lock" | "unlock" }) =>
      thrFn({ data: { token, ...v } }),
    onSuccess: (r: any, v) => {
      if (!r.ok) return toast.error(communityError(r));
      toast.success("Action applied");
      record({ action: `${v.action}_thread`, target_type: "thread", target_id: v.threadId });
    },
  });
  const postAction = useMutation({
    mutationFn: (v: { postId: string; action: "hide" | "unhide" }) => postFn({ data: { token, ...v } }),
    onSuccess: (r: any, v) => {
      if (!r.ok) return toast.error(communityError(r));
      toast.success("Action applied");
      record({ action: `${v.action}_post`, target_type: "post", target_id: v.postId });
    },
  });
  const ban = useMutation({
    mutationFn: (v: { username: string; on: boolean }) =>
      v.on ? banFn({ data: { token, username: v.username } }) : unbanFn({ data: { token, username: v.username } }),
    onSuccess: (r: any, v) => {
      if (!r.ok) return toast.error(communityError(r));
      toast.success("Member updated");
      record({ action: v.on ? "suspend_member" : "lift_suspension", target_type: "member", target_username: v.username });
      memberQ.refetch();
      q.refetch();
    },
  });

  const denied = !!(q.data && !q.data.ok && (q.data.status === 401 || q.data.status === 403));
  const payload: any = q.data?.ok ? q.data.data : null;
  const reports: any[] = payload?.reports ?? [];
  const openCount: number = payload?.open_count ?? (tab === "open" ? reports.length : 0);
  const level: string = payload?.level ?? (fallbackSuper ? "super_moderator" : "moderator");
  const canSuspend = fallbackSuper || level === "super_moderator" || level === "admin";
  const member: any = memberQ.data?.ok ? ((memberQ.data.data as any).profile ?? memberQ.data.data) : null;

  if (q.isLoading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="h-5 w-5 animate-spin inline text-black/40" />
      </div>
    );
  }

  if (denied) {
    return (
      <p className="text-sm text-black/60 text-center py-10">
        This account doesn't have moderator access in the community.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <Tile label="Open reports" value={q.isFetching && !payload ? "…" : openCount} />
        <Tile label="Showing" value={reports.length} />
        <Tile label="Your level" value={level.replace("_", " ")} />
        <Tile label="Can suspend" value={canSuspend ? "Yes" : "No"} />
      </div>

      {/* Look up any member and see what they've been up to. */}
      <div className="rounded-xl bg-white border border-black/10 p-4 mb-4">
        <div className="text-xs font-bold uppercase tracking-wider text-black/50 mb-2 inline-flex items-center gap-1">
          <User className="h-3.5 w-3.5" /> Check a member
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = lookup.trim().replace(/^@/, "");
            if (v.length >= 3) setLookupFor(v);
          }}
          className="flex gap-2"
        >
          <input
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            placeholder="username"
            className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#E5A54B]"
          />
          <button type="submit" className="rounded-lg bg-[#1a1a1a] text-white px-4 py-2 text-sm font-semibold inline-flex items-center gap-1">
            <Search className="h-3.5 w-3.5" /> Check
          </button>
        </form>

        {memberQ.isFetching && <p className="mt-3 text-xs text-black/50">Looking…</p>}
        {!memberQ.isFetching && memberQ.data && !memberQ.data.ok && (
          <p className="mt-3 text-xs text-red-600">
            {memberQ.data.status === 404 ? "No member with that username." : communityError(memberQ.data as any)}
          </p>
        )}
        {member && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-black/10 pt-3">
            <img src={avatarUrl(member.avatar_key)} alt="" className="h-12 w-12 rounded-full object-cover bg-black/5" />
            <div className="min-w-0">
              <div className="font-semibold inline-flex items-center gap-2 flex-wrap">
                {member.username_display ?? member.username}
                <RankBadge rank={member.rank} points={member.points} />
                <Badges badges={[...(member.roles ?? []), ...(member.badges ?? [])]} showMember />
                {member.is_banned && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700">Suspended</span>}
              </div>
              <div className="text-xs text-black/60">
                @{member.username} · {member.thread_count ?? 0} threads · {member.post_count ?? 0} replies · {member.points ?? 0} pts · joined {relTime(member.created_at)}
              </div>
              {member.bio && <p className="mt-1 text-xs text-black/60 line-clamp-2">{member.bio}</p>}
            </div>
            <div className="ml-auto flex gap-2">
              <Link to="/community/u/$username" params={{ username: member.username }} className="text-xs font-semibold rounded bg-black/5 px-3 py-1.5 hover:bg-black/10">
                Open profile
              </Link>
              {canSuspend && (
                <button
                  onClick={() => ban.mutate({ username: member.username, on: !member.is_banned })}
                  className="text-xs font-semibold rounded bg-red-100 text-red-700 px-3 py-1.5 hover:bg-red-200 inline-flex items-center gap-1"
                >
                  <Ban className="h-3 w-3" /> {member.is_banned ? "Lift suspension" : "Suspend"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-black/10 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px capitalize ${tab === t ? "border-[#E5A54B] text-[#E5A54B]" : "border-transparent text-black/60 hover:text-black"}`}
          >
            {t}
            {t === "open" && openCount > 0 && tab !== "open" ? ` (${openCount})` : ""}
          </button>
        ))}
      </div>

      {q.isFetching && !q.data ? (
        <div className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin inline text-black/40" /></div>
      ) : !q.data?.ok ? (
        <p className="text-sm text-red-600 text-center py-10">{communityError(q.data as any)}</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-black/50 text-center py-12">{tab === "open" ? "No open reports 🎉" : `No ${tab} reports.`}</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => {
            const targetUsername: string | null = r.target_user?.username ?? (r.target_type === "user" ? String(r.target_id) : null);
            return (
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
                  {(r.resolved_by || r.handled_by) && (
                    <span>
                      · {r.status} by <strong>{r.resolved_by?.username ?? r.handled_by?.username ?? r.resolved_by ?? r.handled_by}</strong>
                      {r.resolved_at ? ` ${relTime(r.resolved_at)}` : ""}
                    </span>
                  )}
                  {r.target_type === "thread" && (
                    <Link to="/community/t/$threadId" params={{ threadId: String(r.target_id) }} search={{ page: 1 }} className="text-[#E5A54B] font-semibold hover:underline">
                      Open thread
                    </Link>
                  )}
                  {r.thread_id && r.target_type === "post" && (
                    <Link to="/community/t/$threadId" params={{ threadId: String(r.thread_id) }} search={{ page: 1 }} className="text-[#E5A54B] font-semibold hover:underline">
                      Open thread
                    </Link>
                  )}
                  {targetUsername && (
                    <button
                      onClick={() => { setLookup(targetUsername); setLookupFor(targetUsername); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="font-semibold hover:text-[#E5A54B] underline"
                    >
                      Check this member
                    </button>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {r.target_type === "thread" &&
                    (["lock", "unlock", "pin", "unpin", "hide", "unhide"] as const).map((action) => (
                      <button
                        key={action}
                        onClick={() => threadAction.mutate({ threadId: String(r.target_id), action })}
                        className="text-xs inline-flex items-center gap-1 rounded bg-black/5 px-2 py-1 hover:bg-black/10 capitalize"
                      >
                        {action === "lock" && <Lock className="h-3 w-3" />}
                        {action === "unlock" && <Unlock className="h-3 w-3" />}
                        {(action === "pin" || action === "unpin") && <Pin className="h-3 w-3" />}
                        {action === "hide" && <EyeOff className="h-3 w-3" />}
                        {action === "unhide" && <Eye className="h-3 w-3" />}
                        {action}
                      </button>
                    ))}
                  {r.target_type === "post" && (
                    <>
                      <button onClick={() => postAction.mutate({ postId: String(r.target_id), action: "hide" })} className="text-xs inline-flex items-center gap-1 rounded bg-black/5 px-2 py-1 hover:bg-black/10"><EyeOff className="h-3 w-3" /> Hide</button>
                      <button onClick={() => postAction.mutate({ postId: String(r.target_id), action: "unhide" })} className="text-xs inline-flex items-center gap-1 rounded bg-black/5 px-2 py-1 hover:bg-black/10"><Eye className="h-3 w-3" /> Unhide</button>
                    </>
                  )}
                  {canSuspend && targetUsername && (
                    <button
                      onClick={() => ban.mutate({ username: targetUsername, on: true })}
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
            );
          })}
        </ul>
      )}
    </div>
  );
}
