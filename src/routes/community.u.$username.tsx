import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pencil, Bookmark, MessageSquare } from "lucide-react";
import { CommunityShell, RankBadge } from "@/components/community/CommunityShell";
import { getProfileByUsername, listMyBookmarks } from "@/lib/community.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/community/u/$username")({
  head: ({ params }) => ({ meta: [{ title: `@${params.username} — Find-Task Community` }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const fn = useServerFn(getProfileByUsername);
  const bmFn = useServerFn(listMyBookmarks);
  const q = useQuery({ queryKey: ["community-user", username], queryFn: () => fn({ data: { username } }) });

  const [me, setMe] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null)); }, []);

  const isOwner = me && q.data?.ok && (q.data.data as any).profile.id === me;

  const [tab, setTab] = useState<"threads" | "bookmarks">("threads");
  const bmQ = useQuery({
    queryKey: ["my-bookmarks"],
    enabled: !!isOwner && tab === "bookmarks",
    queryFn: () => bmFn(),
  });

  if (q.isLoading) return <CommunityShell><p className="text-sm text-black/50">Loading…</p></CommunityShell>;
  if (!q.data?.ok) return <CommunityShell><p className="text-sm text-red-600">Profile not found.</p></CommunityShell>;
  const { profile, threads } = q.data.data;

  const initial = (profile.display_name ?? profile.username)[0]?.toUpperCase();

  return (
    <CommunityShell>
      <div className="rounded-2xl bg-white border border-black/10 p-6 flex items-center gap-4">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="grid h-20 w-20 rounded-full bg-gradient-to-br from-[#E5A54B] to-[#c88a2f] text-white place-items-center text-2xl font-bold">
            {initial}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-2xl">{profile.display_name ?? profile.username}</h1>
            {isOwner && (
              <Link to="/community/settings" className="inline-flex items-center gap-1 text-xs bg-black/5 hover:bg-black/10 px-2 py-1 rounded font-semibold">
                <Pencil className="h-3 w-3" /> Edit
              </Link>
            )}
          </div>
          <div className="text-sm text-black/60">@{profile.username}</div>
          <div className="mt-2"><RankBadge rank={profile.rank} points={profile.points} /></div>
          {profile.bio && <p className="mt-3 text-sm">{profile.bio}</p>}
        </div>
        <div className="text-center text-xs text-black/60">
          <div className="text-lg font-bold text-[#E5A54B]">{profile.thread_count}</div>threads
          <div className="text-lg font-bold text-[#E5A54B] mt-2">{profile.post_count}</div>replies
        </div>
      </div>

      <div className="flex gap-1 border-b border-black/10 mt-6 mb-3">
        <button onClick={() => setTab("threads")} className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px inline-flex items-center gap-1 ${tab === "threads" ? "border-[#E5A54B] text-[#E5A54B]" : "border-transparent text-black/60 hover:text-black"}`}>
          <MessageSquare className="h-3.5 w-3.5" /> Threads
        </button>
        {isOwner && (
          <button onClick={() => setTab("bookmarks")} className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px inline-flex items-center gap-1 ${tab === "bookmarks" ? "border-[#E5A54B] text-[#E5A54B]" : "border-transparent text-black/60 hover:text-black"}`}>
            <Bookmark className="h-3.5 w-3.5" /> Bookmarks
          </button>
        )}
      </div>

      {tab === "threads" ? (
        <ul className="space-y-2">
          {threads.map((t: any) => (
            <li key={t.id}>
              <Link to="/community/t/$threadId" params={{ threadId: t.id }} className="block rounded-xl bg-white border border-black/10 p-4 hover:border-[#E5A54B]">
                <div className="font-semibold">{t.title}</div>
                <div className="text-xs text-black/50 mt-1">{t.reply_count} replies · score {t.score} · {new Date(t.created_at).toLocaleDateString()}</div>
              </Link>
            </li>
          ))}
          {threads.length === 0 && <p className="text-sm text-black/50">No threads yet.</p>}
        </ul>
      ) : (
        <ul className="space-y-2">
          {bmQ.isLoading && <p className="text-sm text-black/50">Loading…</p>}
          {bmQ.data?.ok && (bmQ.data.data as any[]).length === 0 && (
            <p className="text-sm text-black/50">No bookmarks yet — tap the bookmark icon on any thread to save it.</p>
          )}
          {bmQ.data?.ok && (bmQ.data.data as any[]).map((b: any) => (
            <li key={b.thread_id}>
              <Link to="/community/t/$threadId" params={{ threadId: b.thread_id }} className="block rounded-xl bg-white border border-black/10 p-4 hover:border-[#E5A54B]">
                <div className="font-semibold">{b.community_threads?.title ?? "Thread"}</div>
                <div className="text-xs text-black/50 mt-1">Bookmarked {new Date(b.created_at).toLocaleDateString()}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CommunityShell>
  );
}
