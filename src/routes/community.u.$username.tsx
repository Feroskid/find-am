import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Bookmark, MessageSquare, Flag, Loader2, Ban } from "lucide-react";
import { toast } from "sonner";
import { CommunityShell, RankBadge, Badges } from "@/components/community/CommunityShell";
import { getCommunityProfile, listBookmarks, reportContent, banMember, unbanMember } from "@/lib/community.functions";
import { avatarUrl } from "@/lib/community-avatars";
import { useCommunityMe, communityError, relTime } from "@/lib/community-client";

export const Route = createFileRoute("/community/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Find-Task Community` },
      { name: "description", content: `Community profile for @${params.username}: rank, threads and replies on Find-Task.` },
      { property: "og:title", content: `@${params.username} on Find-Task Community` },
      { property: "og:description", content: `See @${params.username}'s rank and contributions in the Find-Task community.` },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const c = useCommunityMe();
  const fn = useServerFn(getCommunityProfile);
  const bmFn = useServerFn(listBookmarks);
  const reportFn = useServerFn(reportContent);
  const banFn = useServerFn(banMember);
  const unbanFn = useServerFn(unbanMember);

  const q = useQuery({
    queryKey: ["community", "profile", username, c.token],
    queryFn: () => fn({ data: { username, token: c.token } }),
  });

  const isOwner = !!c.me && c.me.username?.toLowerCase() === username.toLowerCase();
  const [tab, setTab] = useState<"about" | "bookmarks">("about");

  const bmQ = useQuery({
    queryKey: ["community", "bookmarks", c.token],
    enabled: isOwner && tab === "bookmarks" && !!c.token,
    queryFn: () => bmFn({ data: { token: c.token!, perPage: 50 } }),
  });

  const report = useMutation({
    mutationFn: (reason: string) => reportFn({ data: { token: c.token!, target_type: "user", target_id: username, reason } }),
    onSuccess: (r) => (r.ok ? toast.success("Reported — a moderator will review") : toast.error(communityError(r))),
  });

  const ban = useMutation({
    mutationFn: (on: boolean) =>
      on ? banFn({ data: { token: c.token!, username } }) : unbanFn({ data: { token: c.token!, username } }),
    onSuccess: (r) => (r.ok ? (q.refetch(), toast.success("Member updated")) : toast.error(communityError(r))),
  });

  if (q.isLoading) {
    return <CommunityShell><div className="py-16 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-black/40" /></div></CommunityShell>;
  }
  if (!q.data?.ok) {
    return <CommunityShell><p className="text-sm text-red-600 text-center py-16">Profile not found.</p></CommunityShell>;
  }

  const p: any = (q.data.data as any).profile ?? q.data.data;
  const bookmarks: any[] = bmQ.data?.ok ? ((bmQ.data.data as any).threads ?? []) : [];

  return (
    <CommunityShell>
      <div className="rounded-2xl bg-white border border-black/10 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <img src={avatarUrl(p.avatar_key)} alt={p.username_display ?? p.username} className="h-20 w-20 rounded-full object-cover bg-black/5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-2xl">{p.username_display ?? p.username}</h1>
            <Badges badges={p.roles} />
            {p.is_banned && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700">Suspended</span>
            )}
            {isOwner && (
              <Link to="/community/settings" className="inline-flex items-center gap-1 text-xs bg-black/5 hover:bg-black/10 px-2 py-1 rounded font-semibold">
                <Pencil className="h-3 w-3" /> Edit
              </Link>
            )}
          </div>
          <div className="text-sm text-black/60">@{p.username}</div>
          <div className="mt-2"><RankBadge rank={p.rank} points={p.points} /></div>
          {p.bio && <p className="mt-3 text-sm whitespace-pre-wrap">{p.bio}</p>}
          {p.signature && <p className="mt-2 text-xs italic text-black/50">{p.signature}</p>}
          <p className="mt-2 text-[11px] text-black/40">Member since {relTime(p.created_at)}</p>
        </div>
        <div className="text-center text-xs text-black/60">
          <div className="text-lg font-bold text-[#E5A54B]">{p.thread_count ?? 0}</div>threads
          <div className="text-lg font-bold text-[#E5A54B] mt-2">{p.post_count ?? 0}</div>replies
        </div>
      </div>

      {!isOwner && c.signedIn && !c.needsUsername && (
        <div className="mt-3 flex gap-2 flex-wrap">
          <button
            onClick={() => {
              const reason = window.prompt("Why are you reporting this member?");
              if (reason && reason.trim().length >= 3) report.mutate(reason.trim());
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold rounded-lg bg-white border border-black/10 px-3 py-1.5 hover:bg-black/5"
          >
            <Flag className="h-3.5 w-3.5" /> Report member
          </button>
          {c.isSuperMod && (
            <button
              onClick={() => ban.mutate(!p.is_banned)}
              className="inline-flex items-center gap-1 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 hover:bg-red-100"
            >
              <Ban className="h-3.5 w-3.5" /> {p.is_banned ? "Lift suspension" : "Suspend member"}
            </button>
          )}
        </div>
      )}

      {isOwner && (
        <div className="flex gap-1 border-b border-black/10 mt-6 mb-3">
          <button onClick={() => setTab("about")} className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px inline-flex items-center gap-1 ${tab === "about" ? "border-[#E5A54B] text-[#E5A54B]" : "border-transparent text-black/60 hover:text-black"}`}>
            <MessageSquare className="h-3.5 w-3.5" /> About
          </button>
          <button onClick={() => setTab("bookmarks")} className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px inline-flex items-center gap-1 ${tab === "bookmarks" ? "border-[#E5A54B] text-[#E5A54B]" : "border-transparent text-black/60 hover:text-black"}`}>
            <Bookmark className="h-3.5 w-3.5" /> Bookmarks
          </button>
        </div>
      )}

      {isOwner && tab === "bookmarks" && (
        <ul className="space-y-2">
          {bmQ.isLoading && <li className="text-sm text-black/50">Loading…</li>}
          {!bmQ.isLoading && bookmarks.length === 0 && (
            <li className="text-sm text-black/50">No bookmarks yet — tap the bookmark button on any thread to save it.</li>
          )}
          {bookmarks.map((t) => (
            <li key={t.id}>
              <Link to="/community/t/$threadId" params={{ threadId: String(t.id) }} search={{ page: 1 }} className="block rounded-xl bg-white border border-black/10 p-4 hover:border-[#E5A54B]">
                <div className="font-semibold">{t.title}</div>
                <div className="text-xs text-black/50 mt-1">{t.reply_count ?? 0} replies · score {t.score ?? 0} · {relTime(t.created_at)}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CommunityShell>
  );
}
