import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CommunityShell, RankBadge } from "@/components/community/CommunityShell";
import { getProfileByUsername } from "@/lib/community.functions";

export const Route = createFileRoute("/community/u/$username")({
  head: ({ params }) => ({ meta: [{ title: `@${params.username} — Find-Task Community` }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const fn = useServerFn(getProfileByUsername);
  const q = useQuery({ queryKey: ["community-user", username], queryFn: () => fn({ data: { username } }) });

  if (q.isLoading) return <CommunityShell><p className="text-sm text-black/50">Loading…</p></CommunityShell>;
  if (!q.data?.ok) return <CommunityShell><p className="text-sm text-red-600">Profile not found.</p></CommunityShell>;
  const { profile, threads } = q.data.data;

  return (
    <CommunityShell>
      <div className="rounded-2xl bg-white border border-black/10 p-6 flex items-center gap-4">
        <div className="grid h-20 w-20 rounded-full bg-gradient-to-br from-[#E5A54B] to-[#c88a2f] text-white place-items-center text-2xl font-bold">
          {(profile.display_name ?? profile.username)[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-2xl">{profile.display_name ?? profile.username}</h1>
          <div className="text-sm text-black/60">@{profile.username}</div>
          <div className="mt-2"><RankBadge rank={profile.rank} points={profile.points} /></div>
          {profile.bio && <p className="mt-3 text-sm">{profile.bio}</p>}
        </div>
        <div className="text-center text-xs text-black/60">
          <div className="text-lg font-bold text-[#E5A54B]">{profile.thread_count}</div>threads
          <div className="text-lg font-bold text-[#E5A54B] mt-2">{profile.post_count}</div>replies
        </div>
      </div>

      <h2 className="mt-6 mb-2 font-bold text-lg">Recent threads</h2>
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
    </CommunityShell>
  );
}
