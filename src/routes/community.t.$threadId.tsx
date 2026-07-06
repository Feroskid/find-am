import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, Loader2, Lock, Bookmark, CheckCircle2, Flag, Pin } from "lucide-react";
import { toast } from "sonner";
import { CommunityShell, RankBadge } from "@/components/community/CommunityShell";
import { getThread, replyToThread, voteOn, toggleBookmark, isBookmarked, acceptAnswer, reportContent } from "@/lib/community.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/community/t/$threadId")({
  head: () => ({ meta: [{ title: "Thread — Find-Task Community" }] }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const gFn = useServerFn(getThread);
  const rFn = useServerFn(replyToThread);
  const vFn = useServerFn(voteOn);
  const bFn = useServerFn(toggleBookmark);
  const ibFn = useServerFn(isBookmarked);
  const aFn = useServerFn(acceptAnswer);
  const reportFn = useServerFn(reportContent);
  const q = useQuery({ queryKey: ["community", "thread", threadId], queryFn: () => gFn({ data: { threadId } }) });
  const [me, setMe] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null)); }, []);

  const bmQ = useQuery({
    queryKey: ["bm", threadId, me],
    enabled: !!me,
    queryFn: () => ibFn({ data: { threadId } }),
  });

  const [body, setBody] = useState("");
  const reply = useMutation({
    mutationFn: () => rFn({ data: { threadId, body: body.trim() } }),
    onSuccess: (r) => r.ok ? (setBody(""), q.refetch(), toast.success("Reply posted (+1 pt)")) : toast.error(r.error),
  });
  const vote = useMutation({
    mutationFn: (v: { targetType: "thread" | "post"; targetId: string; value: number }) => vFn({ data: v }),
    onSuccess: (r) => r.ok ? q.refetch() : toast.error(r.error),
  });
  const bookmark = useMutation({
    mutationFn: () => bFn({ data: { threadId } }),
    onSuccess: (r) => r.ok ? (bmQ.refetch(), toast.success(r.data.bookmarked ? "Bookmarked" : "Removed bookmark")) : toast.error(r.error),
  });
  const accept = useMutation({
    mutationFn: (postId: string) => aFn({ data: { threadId, postId } }),
    onSuccess: (r) => r.ok ? (q.refetch(), toast.success("Answer marked")) : toast.error(r.error),
  });
  const report = useMutation({
    mutationFn: (v: { targetType: "thread" | "post"; targetId: string; reason: string }) => reportFn({ data: v }),
    onSuccess: (r) => r.ok ? toast.success("Reported — a mod will review") : toast.error(r.error),
  });

  if (q.isLoading) return <CommunityShell><div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div></CommunityShell>;
  if (!q.data?.ok) return <CommunityShell><div className="p-8 text-center text-red-600">Thread not found</div></CommunityShell>;

  const { thread, posts, profiles }: any = q.data.data;
  const profById: Record<string, any> = Object.fromEntries(profiles.map((p: any) => [p.id, p]));
  const isAuthor = me && me === thread.author_id;
  const bookmarked = bmQ.data?.ok && (bmQ.data.data as any).bookmarked;

  const Card = ({ authorId, body_md, created_at, score, id, isOp }: any) => {
    const p = profById[authorId];
    const accepted = !isOp && thread.accepted_post_id === id;
    return (
      <div className={`rounded-xl bg-white border overflow-hidden ${accepted ? "border-emerald-400 ring-2 ring-emerald-100" : "border-black/10"}`}>
        {accepted && <div className="px-4 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Accepted answer</div>}
        <div className="flex">
          <div className="w-32 shrink-0 bg-black/[0.02] border-r border-black/5 p-3 text-center">
            {p?.avatar_url ? (
              <img src={p.avatar_url} alt="" className="mx-auto h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#E5A54B] to-[#c88a2f] text-white font-bold">
                {(p?.display_name ?? p?.username ?? "?")[0]?.toUpperCase()}
              </div>
            )}
            <Link to="/community/u/$username" params={{ username: p?.username ?? "unknown" }} className="mt-2 font-semibold text-xs truncate block hover:text-[#E5A54B]">
              {p?.display_name ?? p?.username ?? "user"}
            </Link>
            <div className="mt-1"><RankBadge rank={p?.rank} points={p?.points} /></div>
          </div>
          <div className="flex-1 p-4">
            {isOp && <div className="text-[10px] font-bold uppercase text-[#E5A54B] mb-1">Original post</div>}
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{body_md}</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-black/50 flex-wrap">
              <span>{new Date(created_at).toLocaleString()}</span>
              {!isOp && isAuthor && !thread.is_locked && (
                <button onClick={() => accept.mutate(id)} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${accepted ? "bg-emerald-100 text-emerald-800" : "bg-black/5 hover:bg-emerald-50 hover:text-emerald-700"}`}>
                  <CheckCircle2 className="h-3 w-3" /> {accepted ? "Accepted" : "Accept answer"}
                </button>
              )}
              {me && me !== authorId && (
                <button onClick={() => {
                  const reason = window.prompt("Why are you reporting this?");
                  if (reason && reason.trim().length >= 3) report.mutate({ targetType: isOp ? "thread" : "post", targetId: id, reason: reason.trim() });
                }} className="inline-flex items-center gap-1 hover:text-red-600" aria-label="Report">
                  <Flag className="h-3 w-3" /> Report
                </button>
              )}
              <div className="flex items-center gap-1 ml-auto">
                <button disabled={!me || vote.isPending} onClick={() => vote.mutate({ targetType: isOp ? "thread" : "post", targetId: id, value: 1 })} className="p-1 rounded hover:bg-black/5 disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
                <span className="font-semibold text-sm text-black/70 min-w-[1.5rem] text-center">{score ?? 0}</span>
                <button disabled={!me || vote.isPending} onClick={() => vote.mutate({ targetType: isOp ? "thread" : "post", targetId: id, value: -1 })} className="p-1 rounded hover:bg-black/5 disabled:opacity-40"><ArrowDown className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <CommunityShell>
      <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-bold text-2xl inline-flex items-center gap-2">
            {thread.is_pinned && <Pin className="h-4 w-4 text-[#E5A54B]" />}
            {thread.title}
            {thread.is_locked && <Lock className="inline h-4 w-4 text-black/40" />}
          </h1>
          <div className="text-xs text-black/50 mt-1">{thread.reply_count} replies · {thread.view_count ?? 0} views · {thread.score} score</div>
        </div>
        {me && (
          <button onClick={() => bookmark.mutate()} disabled={bookmark.isPending} className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg ${bookmarked ? "bg-[#E5A54B] text-white" : "bg-white border border-black/10 hover:bg-black/5"}`}>
            <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`} /> {bookmarked ? "Bookmarked" : "Bookmark"}
          </button>
        )}
      </div>

      <div className="space-y-3">
        <Card authorId={thread.author_id} body_md={thread.body_md} created_at={thread.created_at} score={thread.score} id={thread.id} isOp />
        {posts.map((p: any) => (
          <Card key={p.id} authorId={p.author_id} body_md={p.body_md} created_at={p.created_at} score={p.score} id={p.id} />
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-white border border-black/10 p-4">
        {!me ? (
          <div className="text-sm text-black/60 text-center">Sign in to reply.</div>
        ) : thread.is_locked ? (
          <div className="text-sm text-black/60 text-center">Thread is locked.</div>
        ) : (
          <>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Write a reply…" className="w-full rounded-lg border border-black/15 p-3 outline-none focus:border-[#E5A54B] text-sm" />
            <div className="mt-2 flex justify-end">
              <button disabled={!body.trim() || reply.isPending} onClick={() => reply.mutate()} className="rounded-lg bg-[#E5A54B] text-white px-5 py-2 font-bold text-sm disabled:opacity-50">
                {reply.isPending ? "Posting…" : "Post reply"}
              </button>
            </div>
          </>
        )}
      </div>
    </CommunityShell>
  );
}
