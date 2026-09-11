import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { z } from "zod";
import { CommunityShell, AuthorChip } from "@/components/community/CommunityShell";
import { searchCommunity } from "@/lib/community.functions";
import { useCommunityMe, relTime } from "@/lib/community-client";

export const Route = createFileRoute("/community/search")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Search discussions — Find-Task Community" },
      { name: "description", content: "Search Find-Task community threads and replies." },
    ],
  }),
  validateSearch: (s) => z.object({ q: z.string().optional().default("") }).parse(s),
  component: SearchPage,
});

function SearchPage() {
  const { q: initialQ } = Route.useSearch();
  const c = useCommunityMe();
  const [q, setQ] = useState(initialQ ?? "");
  const fn = useServerFn(searchCommunity);
  const query = useQuery({
    queryKey: ["community", "search", q, c.token],
    enabled: q.trim().length >= 2,
    queryFn: () => fn({ data: { q: q.trim(), perPage: 20, token: c.token } }),
  });

  const payload: any = query.data?.ok ? query.data.data : null;
  const threads: any[] = payload?.threads ?? [];
  const posts: any[] = payload?.posts ?? [];

  return (
    <CommunityShell>
      <div className="mb-4">
        <h1 className="font-bold text-2xl mb-3">Search the community</h1>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            placeholder="Search threads and replies…"
            className="w-full rounded-full bg-white border border-black/10 pl-10 pr-4 py-2.5 outline-none focus:border-[#E5A54B]"
          />
        </div>
      </div>

      {q.trim().length < 2 ? (
        <p className="text-sm text-black/50">Type at least 2 characters to search.</p>
      ) : query.isLoading ? (
        <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-black/40" /></div>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="font-bold text-sm uppercase tracking-wider text-black/50 mb-2">Threads</h2>
            <ul className="space-y-2">
              {threads.map((t) => (
                <li key={t.id}>
                  <Link to="/community/t/$threadId" params={{ threadId: String(t.id) }} search={{ page: 1 }} className="block rounded-xl bg-white border border-black/10 p-4 hover:border-[#E5A54B]">
                    <div className="font-semibold">{t.title}</div>
                    <div className="text-xs text-black/50 mt-1 flex items-center gap-2 flex-wrap">
                      <AuthorChip author={t.author} size={4} />
                      <span>· {t.reply_count ?? 0} replies · score {t.score ?? 0} · {relTime(t.created_at)}</span>
                    </div>
                  </Link>
                </li>
              ))}
              {threads.length === 0 && <li className="text-sm text-black/50">No threads matched.</li>}
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-sm uppercase tracking-wider text-black/50 mb-2">Replies</h2>
            <ul className="space-y-2">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link to="/community/t/$threadId" params={{ threadId: String(p.thread_id) }} search={{ page: 1 }} className="block rounded-xl bg-white border border-black/10 p-4 hover:border-[#E5A54B]">
                    <div className="text-xs font-semibold text-black/60">{p.thread_title}</div>
                    <div className="text-sm mt-1 line-clamp-3">{p.snippet}</div>
                    <div className="text-xs text-black/50 mt-1 flex items-center gap-2 flex-wrap">
                      <AuthorChip author={p.author} size={4} />
                      <span>· {relTime(p.created_at)}</span>
                    </div>
                  </Link>
                </li>
              ))}
              {posts.length === 0 && <li className="text-sm text-black/50">No replies matched.</li>}
            </ul>
          </section>
        </div>
      )}
    </CommunityShell>
  );
}
