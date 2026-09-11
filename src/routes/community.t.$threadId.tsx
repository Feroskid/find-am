import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { ArrowUp, ArrowDown, Loader2, Lock, Bookmark, CheckCircle2, Flag, Pin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CommunityShell, RankBadge, Badges } from "@/components/community/CommunityShell";
import {
  getThread,
  replyToThread,
  voteOn,
  toggleBookmark,
  listBookmarks,
  acceptAnswer,
  reportContent,
  deleteThread,
  deletePost,
} from "@/lib/community.functions";
import { avatarUrl } from "@/lib/community-avatars";
import { useCommunityMe, communityError, relTime } from "@/lib/community-client";

const SearchSchema = z.object({ page: z.coerce.number().int().min(1).max(500).optional().default(1) });

export const Route = createFileRoute("/community/t/$threadId")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Discussion — Find-Task Community" },
      { name: "description", content: "A discussion in the Find-Task community: questions, answers and tips from Nigerian taskers." },
      { property: "og:title", content: "Find-Task Community discussion" },
      { property: "og:description", content: "Read the conversation and join in on Find-Task." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ThreadPage,
});

const PER_PAGE = 20;

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const c = useCommunityMe();

  const gFn = useServerFn(getThread);
  const rFn = useServerFn(replyToThread);
  const vFn = useServerFn(voteOn);
  const bFn = useServerFn(toggleBookmark);
  const bmListFn = useServerFn(listBookmarks);
  const aFn = useServerFn(acceptAnswer);
  const reportFn = useServerFn(reportContent);
  const delThreadFn = useServerFn(deleteThread);
  const delPostFn = useServerFn(deletePost);

  const q = useQuery({
    queryKey: ["community", "thread", threadId, page, c.token],
    queryFn: () => gFn({ data: { threadId, page, perPage: PER_PAGE, token: c.token } }),
  });

  const bmQ = useQuery({
    queryKey: ["community", "bookmarks", c.token],
    enabled: !!c.token && !c.needsUsername,
    queryFn: () => bmListFn({ data: { token: c.token!, perPage: 50 } }),
  });
  const [bmOverride, setBmOverride] = useState<boolean | null>(null);
  const bookmarkedFromList = bmQ.data?.ok
    ? ((bmQ.data.data as any).threads ?? []).some((t: any) => String(t.id) === String(threadId))
    : false;
  const bookmarked = bmOverride ?? bookmarkedFromList;

  const [body, setBody] = useState("");

  const canWrite = c.signedIn && !c.needsUsername && !c.isBanned;

  const reply = useMutation({
    mutationFn: () => rFn({ data: { token: c.token!, threadId, body_md: body.trim() } }),
    onSuccess: (r) => {
      if (!r.ok) return toast.error(communityError(r));
      setBody("");
      q.refetch();
      toast.success("Reply posted (+1 pt)");
    },
  });

  const vote = useMutation({
    mutationFn: (v: { target_type: "thread" | "post"; target_id: string; value: 1 | -1 | 0 }) =>
      vFn({ data: { token: c.token!, ...v } }),
    onSuccess: (r) => (r.ok ? q.refetch() : toast.error(communityError(r))),
  });

  const bookmark = useMutation({
    mutationFn: () => bFn({ data: { token: c.token!, threadId } }),
    onSuccess: (r) => {
      if (!r.ok) return toast.error(communityError(r));
      const on = !!(r.data as any).bookmarked;
      setBmOverride(on);
      bmQ.refetch();
      toast.success(on ? "Bookmarked" : "Removed bookmark");
    },
  });

  const accept = useMutation({
    mutationFn: (postId: string) => aFn({ data: { token: c.token!, threadId, postId } }),
    onSuccess: (r) => (r.ok ? (q.refetch(), toast.success("Answer updated")) : toast.error(communityError(r))),
  });

  const report = useMutation({
    mutationFn: (v: { target_type: "thread" | "post"; target_id: string; reason: string }) =>
      reportFn({ data: { token: c.token!, ...v } }),
    onSuccess: (r) => (r.ok ? toast.success("Reported — a moderator will review") : toast.error(communityError(r))),
  });

  const removeThread = useMutation({
    mutationFn: () => delThreadFn({ data: { token: c.token!, threadId } }),
    onSuccess: (r) => {
      if (!r.ok) return toast.error(communityError(r));
      toast.success("Thread deleted");
      navigate({ to: "/community/c/$slug", params: { slug: categorySlug }, search: { page: 1, sort: "latest" } });
    },
  });

  const removePost = useMutation({
    mutationFn: (postId: string) => delPostFn({ data: { token: c.token!, postId } }),
    onSuccess: (r) => (r.ok ? (q.refetch(), toast.success("Reply deleted")) : toast.error(communityError(r))),
  });

  if (q.isLoading) {
    return <CommunityShell><div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div></CommunityShell>;
  }
  if (!q.data?.ok) {
    return <CommunityShell><div className="p-8 text-center text-red-600">{communityError(q.data as any)}</div></CommunityShell>;
  }

  const payload: any = q.data.data;
  const thread = payload.thread;
  const categorySlug: string = payload.category_slug ?? "general";
  const posts: any[] = payload.posts ?? [];
  const total: number = payload.total ?? posts.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  const askReport = (target_type: "thread" | "post", target_id: string) => {
    const reason = window.prompt("Why are you reporting this?");
    if (reason && reason.trim().length >= 3) report.mutate({ target_type, target_id, reason: reason.trim() });
  };

  const Card = ({ item, isOp }: { item: any; isOp?: boolean }) => {
    if (item.is_deleted) {
      return (
        <div className="rounded-xl bg-white border border-dashed border-black/15 p-4 text-sm text-black/40 italic">
          [removed]
        </div>
      );
    }
    const a = item.author;
    const accepted = !isOp && thread.accepted_post_id && String(thread.accepted_post_id) === String(item.id);
    const targetType = isOp ? "thread" : "post";
    return (
      <div className={`rounded-xl bg-white border overflow-hidden ${accepted ? "border-emerald-400 ring-2 ring-emerald-100" : "border-black/10"}`}>
        {accepted && (
          <div className="px-4 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Accepted answer
          </div>
        )}
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-32 shrink-0 bg-black/[0.02] sm:border-r border-black/5 p-3 text-center">
            <img src={avatarUrl(a?.avatar_key)} alt={a?.username ?? "member"} className="mx-auto h-12 w-12 rounded-full object-cover bg-black/5" />
            <Link to="/community/u/$username" params={{ username: a?.username ?? "unknown" }} className="mt-2 font-semibold text-xs truncate block hover:text-[#E5A54B]">
              {a?.username_display ?? a?.username ?? "member"}
            </Link>
            <div className="mt-1 flex flex-wrap justify-center gap-1">
              <RankBadge rank={a?.rank} />
              <Badges badges={a?.badges} />
            </div>
          </div>
          <div className="flex-1 p-4 min-w-0">
            {isOp && <div className="text-[10px] font-bold uppercase text-[#E5A54B] mb-1">Original post</div>}
            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{item.body_md}</div>
            <div className="mt-3 flex items-center gap-3 text-xs text-black/50 flex-wrap">
              <span>{relTime(item.created_at)}</span>
              {item.edited_at && <span>· edited</span>}
              {!isOp && thread.is_mine && !thread.is_locked && canWrite && (
                <button
                  onClick={() => accept.mutate(String(item.id))}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${accepted ? "bg-emerald-100 text-emerald-800" : "bg-black/5 hover:bg-emerald-50 hover:text-emerald-700"}`}
                >
                  <CheckCircle2 className="h-3 w-3" /> {accepted ? "Accepted" : "Accept answer"}
                </button>
              )}
              {item.is_mine && canWrite && (
                <button
                  onClick={() => {
                    if (!window.confirm(isOp ? "Delete this thread?" : "Delete this reply?")) return;
                    isOp ? removeThread.mutate() : removePost.mutate(String(item.id));
                  }}
                  className="inline-flex items-center gap-1 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              )}
              {canWrite && !item.is_mine && (
                <button onClick={() => askReport(targetType, String(item.id))} className="inline-flex items-center gap-1 hover:text-red-600">
                  <Flag className="h-3 w-3" /> Report
                </button>
              )}
              <div className="flex items-center gap-1 ml-auto">
                <button
                  disabled={!canWrite || vote.isPending}
                  onClick={() => vote.mutate({ target_type: targetType, target_id: String(item.id), value: item.my_vote === 1 ? 0 : 1 })}
                  className={`p-1 rounded hover:bg-black/5 disabled:opacity-40 ${item.my_vote === 1 ? "text-[#E5A54B]" : ""}`}
                  aria-label="Upvote"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <span className="font-semibold text-sm text-black/70 min-w-[1.5rem] text-center">{item.score ?? 0}</span>
                <button
                  disabled={!canWrite || vote.isPending}
                  onClick={() => vote.mutate({ target_type: targetType, target_id: String(item.id), value: item.my_vote === -1 ? 0 : -1 })}
                  className={`p-1 rounded hover:bg-black/5 disabled:opacity-40 ${item.my_vote === -1 ? "text-red-600" : ""}`}
                  aria-label="Downvote"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <CommunityShell>
      <div className="text-xs text-black/50 mb-2">
        <Link to="/community" className="hover:underline">Community</Link>
        {" / "}
        <Link to="/community/c/$slug" params={{ slug: categorySlug }} search={{ page: 1, sort: "latest" }} className="hover:underline">
          {payload.category_name ?? categorySlug}
        </Link>
      </div>

      <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-bold text-2xl inline-flex items-center gap-2 flex-wrap">
            {thread.is_pinned && <Pin className="h-4 w-4 text-[#E5A54B]" />}
            {thread.title}
            {thread.is_locked && <Lock className="inline h-4 w-4 text-black/40" />}
          </h1>
          <div className="text-xs text-black/50 mt-1">
            {thread.reply_count ?? 0} replies · {thread.view_count ?? 0} views · {thread.score ?? 0} score
          </div>
          {(thread.tags ?? []).length > 0 && (
            <div className="mt-2 flex gap-1 flex-wrap">
              {thread.tags.map((t: string) => (
                <span key={t} className="text-[11px] rounded bg-black/5 px-2 py-0.5">#{t}</span>
              ))}
            </div>
          )}
        </div>
        {canWrite && (
          <button
            onClick={() => bookmark.mutate()}
            disabled={bookmark.isPending}
            className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg ${bookmarked ? "bg-[#E5A54B] text-white" : "bg-white border border-black/10 hover:bg-black/5"}`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`} /> {bookmarked ? "Bookmarked" : "Bookmark"}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {page === 1 && <Card item={{ ...thread, is_mine: thread.is_mine }} isOp />}
        {posts.map((p) => <Card key={p.id} item={p} />)}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <button disabled={page <= 1} onClick={() => navigate({ search: { page: page - 1 } })} className="rounded-lg bg-white border border-black/10 px-3 py-1.5 disabled:opacity-40">Previous</button>
          <span className="text-black/60">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => navigate({ search: { page: page + 1 } })} className="rounded-lg bg-white border border-black/10 px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-white border border-black/10 p-4">
        {!c.signedIn ? (
          <div className="text-sm text-black/60 text-center">
            <Link to="/login" className="text-[#E5A54B] font-semibold hover:underline">Sign in</Link> to reply.
          </div>
        ) : c.needsUsername ? (
          <div className="text-sm text-black/60 text-center">
            <Link to="/community/username" className="text-[#E5A54B] font-semibold hover:underline">Pick a username</Link> to join the conversation.
          </div>
        ) : c.isBanned ? (
          <div className="text-sm text-black/60 text-center">Your community access is suspended.</div>
        ) : thread.is_locked ? (
          <div className="text-sm text-black/60 text-center">This thread is locked.</div>
        ) : (
          <>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Write a reply…"
              className="w-full rounded-lg border border-black/15 p-3 outline-none focus:border-[#E5A54B] text-sm"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-black/40">{body.length}/5000</span>
              <button
                disabled={!body.trim() || reply.isPending}
                onClick={() => reply.mutate()}
                className="rounded-lg bg-[#E5A54B] text-white px-5 py-2 font-bold text-sm disabled:opacity-50"
              >
                {reply.isPending ? "Posting…" : "Post reply"}
              </button>
            </div>
          </>
        )}
      </div>
    </CommunityShell>
  );
}
