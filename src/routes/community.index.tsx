import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, TrendingUp, Lightbulb, Cpu, Coffee, LifeBuoy, ArrowRight, Loader2 } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { listCategories, listCategoryThreads } from "@/lib/community.functions";
import { useCommunityMe, relTime } from "@/lib/community-client";

export const Route = createFileRoute("/community/")({
  head: () => ({
    meta: [
      { title: "Community — Find-Task" },
      { name: "description", content: "Join the Find-Task community. Share tips, earn ranks, and connect with taskers across Nigeria." },
      { property: "og:title", content: "Find-Task Community" },
      { property: "og:description", content: "Discussions, tips, and rankings for the Find-Task community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommunityIndex,
});

const ICONS: Record<string, any> = { MessageSquare, TrendingUp, Lightbulb, Cpu, Coffee, LifeBuoy };

function CommunityIndex() {
  const c = useCommunityMe();
  const catsFn = useServerFn(listCategories);
  const threadsFn = useServerFn(listCategoryThreads);
  const catsQ = useQuery({ queryKey: ["community", "categories"], queryFn: () => catsFn() });
  const latestQ = useQuery({
    queryKey: ["community", "latest", c.token],
    queryFn: () => threadsFn({ data: { slug: "general", perPage: 10, sort: "latest", token: c.token } }),
  });

  const categories: any[] = catsQ.data?.ok ? ((catsQ.data.data as any).categories ?? []) : [];
  const latest: any[] = latestQ.data?.ok ? ((latestQ.data.data as any).threads ?? []) : [];

  return (
    <CommunityShell>
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] text-white p-8">
        <h1 className="font-bold text-3xl sm:text-4xl tracking-tight">Talk shop with the Find-Task community</h1>
        <p className="mt-2 text-white/70 max-w-2xl">
          Share earning strategies, ask questions, level up your rank — JJC to OG👑. Points come from threads, replies and upvotes.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {c.signedIn ? (
            <Link to={c.needsUsername ? "/community/username" : "/community/new"} className="rounded-lg bg-[#E5A54B] text-white font-bold px-5 py-2.5 hover:opacity-90">
              {c.needsUsername ? "Pick your username" : "Start a thread"}
            </Link>
          ) : (
            <Link to="/login" className="rounded-lg bg-[#E5A54B] text-white font-bold px-5 py-2.5 hover:opacity-90">Sign in to post</Link>
          )}
          <Link to="/community/search" search={{ q: "" } as any} className="rounded-lg bg-white/10 text-white font-semibold px-5 py-2.5 hover:bg-white/20">Search discussions</Link>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="font-bold text-lg mb-3">Categories</h2>
          {catsQ.isLoading ? (
            <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-black/40" /></div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {categories.map((cat) => {
                const Icon = ICONS[cat.icon] ?? MessageSquare;
                return (
                  <Link
                    key={cat.id ?? cat.slug}
                    to="/community/c/$slug"
                    params={{ slug: cat.slug }}
                    className="group rounded-xl border border-black/10 bg-white p-4 hover:border-[#E5A54B] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#E5A54B]/10 text-[#E5A54B]"><Icon className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold">{cat.name}</div>
                          <ArrowRight className="h-4 w-4 text-black/30 group-hover:text-[#E5A54B]" />
                        </div>
                        <div className="text-xs text-black/60 mt-1 line-clamp-2">{cat.description}</div>
                        <div className="mt-2 text-[11px] text-black/50">{cat.thread_count ?? 0} threads · {cat.post_count ?? 0} posts</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {categories.length === 0 && <p className="text-sm text-black/50">Categories are on the way.</p>}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-bold text-lg mb-3">Latest</h2>
          <ul className="space-y-2">
            {latest.length === 0 && <li className="text-sm text-black/50">No threads yet. Be the first!</li>}
            {latest.map((t) => (
              <li key={t.id}>
                <Link
                  to="/community/c/$slug/$threadId"
                  params={{ slug: t.category_slug ?? "general", threadId: String(t.id) }}
                  className="block rounded-lg border border-black/10 bg-white p-3 hover:border-[#E5A54B]"
                >
                  <div className="font-semibold text-sm line-clamp-2">{t.title}</div>
                  <div className="text-[11px] text-black/50 mt-1">
                    {t.reply_count ?? 0} replies · {t.score ?? 0} pts · {relTime(t.last_reply_at ?? t.created_at)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </CommunityShell>
  );
}
