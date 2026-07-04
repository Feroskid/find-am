import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pin, Lock, MessageCircle, ArrowUp } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { listThreadsByCategory } from "@/lib/community.functions";

export const Route = createFileRoute("/community/c/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — Find-Task Community` }] }),
  component: CategoryPage,
});

function rel(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function CategoryPage() {
  const { slug } = Route.useParams();
  const fn = useServerFn(listThreadsByCategory);
  const q = useQuery({ queryKey: ["community", "cat", slug], queryFn: () => fn({ data: { slug, limit: 50 } }) });
  const cat: any = q.data?.ok ? (q.data.data as any).category : null;
  const threads: any[] = q.data?.ok ? (q.data.data as any).threads : [];

  return (
    <CommunityShell>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-black/50"><Link to="/community" className="hover:underline">← Community</Link></div>
          <h1 className="font-bold text-2xl mt-1">{cat?.name ?? slug}</h1>
          {cat?.description && <p className="text-sm text-black/60 mt-1">{cat.description}</p>}
        </div>
        <Link to="/community/new" search={{ category: slug } as any} className="inline-flex items-center gap-1 rounded-lg bg-[#1a1a1a] text-white px-3 py-2 text-sm font-semibold">
          <Plus className="h-4 w-4" /> New thread
        </Link>
      </div>

      <div className="rounded-xl bg-white border border-black/10 divide-y divide-black/5">
        {threads.length === 0 && <div className="p-8 text-center text-sm text-black/50">No threads yet. Start one!</div>}
        {threads.map((t) => (
          <Link key={t.id} to="/community/t/$threadId" params={{ threadId: t.id }} className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02]">
            {t.is_pinned && <Pin className="h-3.5 w-3.5 text-[#E5A54B] shrink-0" />}
            {t.is_locked && <Lock className="h-3.5 w-3.5 text-black/40 shrink-0" />}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate">{t.title}</div>
              <div className="text-[11px] text-black/50 mt-0.5">{rel(t.last_reply_at ?? t.created_at)}</div>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-black/60 shrink-0">
              <span className="inline-flex items-center gap-1"><ArrowUp className="h-3 w-3" /> {t.score ?? 0}</span>
              <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {t.reply_count ?? 0}</span>
            </div>
          </Link>
        ))}
      </div>
    </CommunityShell>
  );
}
