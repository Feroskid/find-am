import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, Pin, Lock, MessageCircle, ArrowUp, Loader2, CheckCircle2 } from "lucide-react";
import { CommunityShell, AuthorChip } from "@/components/community/CommunityShell";
import { listCategoryThreads } from "@/lib/community.functions";
import { useCommunityMe, relTime } from "@/lib/community-client";

const SearchSchema = z.object({
  page: z.coerce.number().int().min(1).max(500).optional().default(1),
  sort: z.enum(["latest", "top"]).optional().default("latest"),
});

export const Route = createFileRoute("/community/c/$slug")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} discussions — Find-Task Community` },
      { name: "description", content: `Threads, questions and tips in the ${params.slug} category of the Find-Task community.` },
      { property: "og:title", content: `${params.slug} — Find-Task Community` },
      { property: "og:description", content: `Browse ${params.slug} discussions in the Find-Task community.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CategoryPage,
});

const PER_PAGE = 20;

function CategoryPage() {
  const { slug } = Route.useParams();
  const { page, sort } = Route.useSearch();
  const navigate = Route.useNavigate();
  const c = useCommunityMe();
  const fn = useServerFn(listCategoryThreads);
  const q = useQuery({
    queryKey: ["community", "cat", slug, page, sort, c.token],
    queryFn: () => fn({ data: { slug, page, perPage: PER_PAGE, sort, token: c.token } }),
  });

  const payload: any = q.data?.ok ? q.data.data : null;
  const cat = payload?.category ?? null;
  const threads: any[] = payload?.threads ?? [];
  const total: number = payload?.total ?? threads.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <CommunityShell>
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs text-black/50"><Link to="/community" className="hover:underline">← Community</Link></div>
          <h1 className="font-bold text-2xl mt-1">{cat?.name ?? slug}</h1>
          {cat?.description && <p className="text-sm text-black/60 mt-1">{cat.description}</p>}
        </div>
        <Link
          to={c.signedIn ? (c.needsUsername ? "/community/username" : "/community/new") : "/login"}
          search={c.signedIn && !c.needsUsername ? ({ category: slug } as any) : undefined}
          className="inline-flex items-center gap-1 rounded-lg bg-[#1a1a1a] text-white px-3 py-2 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> New thread
        </Link>
      </div>

      <div className="mb-3 flex gap-1">
        {(["latest", "top"] as const).map((s) => (
          <button
            key={s}
            onClick={() => navigate({ search: { page: 1, sort: s } })}
            className={`px-3 py-1.5 text-sm font-semibold rounded-lg ${sort === s ? "bg-[#1a1a1a] text-white" : "bg-white border border-black/10 hover:bg-black/5"}`}
          >
            {s === "latest" ? "Latest" : "Top"}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-black/40" /></div>
      ) : (
        <div className="rounded-xl bg-white border border-black/10 divide-y divide-black/5">
          {threads.length === 0 && <div className="p-8 text-center text-sm text-black/50">No threads yet. Start one!</div>}
          {threads.map((t) => (
            <div key={t.id} className="px-4 py-3 hover:bg-black/[0.02]">
              <div className="flex items-center gap-2">
                {t.is_pinned && <Pin className="h-3.5 w-3.5 text-[#E5A54B] shrink-0" />}
                {t.is_locked && <Lock className="h-3.5 w-3.5 text-black/40 shrink-0" />}
                {t.accepted_post_id && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                <Link
                  to="/community/t/$threadId"
                  params={{ threadId: String(t.id) }}
                  search={{ page: 1 }}
                  className="font-semibold text-sm truncate hover:text-[#E5A54B]"
                >
                  {t.title}
                </Link>
                <div className="ml-auto hidden sm:flex items-center gap-4 text-xs text-black/60 shrink-0">
                  <span className="inline-flex items-center gap-1"><ArrowUp className="h-3 w-3" /> {t.score ?? 0}</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {t.reply_count ?? 0}</span>
                </div>
              </div>
              <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-black/50">
                <AuthorChip author={t.author} size={5} />
                <span>· {relTime(t.created_at)}</span>
                {t.last_reply_at && <span>· last reply {relTime(t.last_reply_at)}</span>}
                {(t.tags ?? []).map((tag: string) => (
                  <span key={tag} className="rounded bg-black/5 px-1.5 py-0.5">#{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => navigate({ search: { page: page - 1, sort } })}
            className="rounded-lg bg-white border border-black/10 px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-black/60">Page {page} of {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => navigate({ search: { page: page + 1, sort } })}
            className="rounded-lg bg-white border border-black/10 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </CommunityShell>
  );
}
