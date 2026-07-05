import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { z } from "zod";
import { CommunityShell } from "@/components/community/CommunityShell";
import { searchCommunity } from "@/lib/community.functions";

export const Route = createFileRoute("/community/search")({
  head: () => ({ meta: [{ title: "Search — Find-Task Community" }] }),
  validateSearch: (s) => z.object({ q: z.string().optional().default("") }).parse(s),
  component: SearchPage,
});

function SearchPage() {
  const { q: initialQ } = Route.useSearch();
  const [q, setQ] = useState(initialQ ?? "");
  const fn = useServerFn(searchCommunity);
  const query = useQuery({
    queryKey: ["community-search", q],
    enabled: q.trim().length >= 2,
    queryFn: () => fn({ data: { q: q.trim() } }),
  });

  return (
    <CommunityShell>
      <div className="mb-4">
        <h1 className="font-bold text-2xl mb-3">Search the community</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus placeholder="Search threads…"
            className="w-full rounded-full bg-white border border-black/10 pl-10 pr-4 py-2.5 outline-none focus:border-[#E5A54B]" />
        </div>
      </div>
      {q.trim().length < 2 ? (
        <p className="text-sm text-black/50">Type at least 2 characters to search.</p>
      ) : query.isLoading ? (
        <p className="text-sm text-black/50">Searching…</p>
      ) : (
        <ul className="space-y-2">
          {(query.data?.ok ? query.data.data.threads : []).map((t: any) => (
            <li key={t.id}>
              <Link to="/community/t/$threadId" params={{ threadId: t.id }} className="block rounded-xl bg-white border border-black/10 p-4 hover:border-[#E5A54B]">
                <div className="font-semibold">{t.title}</div>
                <div className="text-xs text-black/50 mt-1">{t.reply_count} replies · score {t.score}</div>
              </Link>
            </li>
          ))}
          {query.data?.ok && query.data.data.threads.length === 0 && <p className="text-sm text-black/50">No matches.</p>}
        </ul>
      )}
    </CommunityShell>
  );
}
