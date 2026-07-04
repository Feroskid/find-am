import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, TrendingUp, Lightbulb, Cpu, Coffee, LifeBuoy, ArrowRight } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { listCategories, listLatestThreads } from "@/lib/community.functions";

export const Route = createFileRoute("/community/")({
  head: () => ({
    meta: [
      { title: "Community — Find-Task" },
      { name: "description", content: "Join the Find-Task community. Share tips, earn ranks, and connect with taskers across Nigeria." },
      { property: "og:title", content: "Find-Task Community" },
      { property: "og:description", content: "Discussions, tips, and rankings for the Find-Task community." },
    ],
  }),
  component: CommunityIndex,
});

const ICONS: Record<string, any> = { MessageSquare, TrendingUp, Lightbulb, Cpu, Coffee, LifeBuoy };

function CommunityIndex() {
  const catsFn = useServerFn(listCategories);
  const latestFn = useServerFn(listLatestThreads);
  const catsQ = useQuery({ queryKey: ["community", "categories"], queryFn: () => catsFn() });
  const latestQ = useQuery({ queryKey: ["community", "latest"], queryFn: () => latestFn({ data: { limit: 10 } }) });

  const categories: any[] = catsQ.data?.ok ? catsQ.data.data : [];
  const latest: any[] = latestQ.data?.ok ? latestQ.data.data : [];

  return (
    <CommunityShell>
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] text-white p-8">
        <h1 className="font-bold text-3xl sm:text-4xl tracking-tight">Talk shop with the Find-Task community</h1>
        <p className="mt-2 text-white/70 max-w-2xl">Share earning strategies, ask questions, level up your rank. From Newbie to Legend — points from posts, replies, and upvotes.</p>
        <div className="mt-5 flex gap-3">
          <Link to="/community/auth" className="rounded-lg bg-[#E5A54B] text-white font-bold px-5 py-2.5 hover:opacity-90">Create account</Link>
          <Link to="/community/new" className="rounded-lg bg-white/10 text-white font-semibold px-5 py-2.5 hover:bg-white/20">Start a thread</Link>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="font-bold text-lg mb-3">Categories</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {categories.map((c) => {
              const Icon = ICONS[c.icon] ?? MessageSquare;
              return (
                <Link
                  key={c.id}
                  to="/community/c/$slug"
                  params={{ slug: c.slug }}
                  className="group rounded-xl border border-black/10 bg-white p-4 hover:border-[#E5A54B] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#E5A54B]/10 text-[#E5A54B]"><Icon className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold">{c.name}</div>
                        <ArrowRight className="h-4 w-4 text-black/30 group-hover:text-[#E5A54B]" />
                      </div>
                      <div className="text-xs text-black/60 mt-1 line-clamp-2">{c.description}</div>
                      <div className="mt-2 text-[11px] text-black/50">{c.thread_count} threads · {c.post_count} posts</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="font-bold text-lg mb-3">Latest</h2>
          <ul className="space-y-2">
            {latest.length === 0 && <li className="text-sm text-black/50">No threads yet. Be the first!</li>}
            {latest.map((t) => (
              <li key={t.id}>
                <Link to="/community/t/$threadId" params={{ threadId: t.id }} className="block rounded-lg border border-black/10 bg-white p-3 hover:border-[#E5A54B]">
                  <div className="font-semibold text-sm line-clamp-2">{t.title}</div>
                  <div className="text-[11px] text-black/50 mt-1">{t.reply_count} replies · {t.score} pts</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </CommunityShell>
  );
}
