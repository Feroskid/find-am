import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CommunityShell } from "@/components/community/CommunityShell";
import { listCategories, createThread } from "@/lib/community.functions";
import { supabase } from "@/integrations/supabase/client";

const Search = z.object({ category: z.string().optional() });

export const Route = createFileRoute("/community/new")({
  validateSearch: (s) => Search.parse(s),
  head: () => ({ meta: [{ title: "New thread — Find-Task Community" }] }),
  component: NewThreadPage,
});

function NewThreadPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const catsFn = useServerFn(listCategories);
  const createFn = useServerFn(createThread);
  const catsQ = useQuery({ queryKey: ["community", "categories"], queryFn: () => catsFn() });
  const cats: any[] = catsQ.data?.ok ? catsQ.data.data : [];
  const [category, setCategory] = useState<string>(search.category ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (!data.session) navigate({ to: "/community/auth" }); });
  }, [navigate]);
  useEffect(() => { if (!category && cats.length) setCategory(cats[0].slug); }, [cats, category]);

  const create = useMutation({
    mutationFn: () => createFn({ data: { categorySlug: category, title: title.trim(), body: body.trim() } }),
    onSuccess: (r) => {
      if (!r.ok) return toast.error(r.error);
      toast.success("Thread posted (+2 pts)");
      navigate({ to: "/community/t/$threadId", params: { threadId: (r.data as any).id } });
    },
  });

  return (
    <CommunityShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="font-bold text-2xl mb-4">Start a new thread</h1>
        <div className="rounded-2xl bg-white border border-black/10 p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase text-black/60">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 outline-none focus:border-[#E5A54B]">
              {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-black/60">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="What's on your mind?" className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2.5 outline-none focus:border-[#E5A54B]" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-black/60">Body</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="Share your thoughts. Markdown supported." className="mt-1 w-full rounded-lg border border-black/15 p-3 outline-none focus:border-[#E5A54B] text-sm" />
          </div>
          <div className="flex justify-end">
            <button disabled={!title.trim() || !body.trim() || !category || create.isPending} onClick={() => create.mutate()} className="rounded-lg bg-[#E5A54B] text-white px-6 py-2.5 font-bold disabled:opacity-50">
              {create.isPending ? "Posting…" : "Post thread"}
            </button>
          </div>
        </div>
      </div>
    </CommunityShell>
  );
}
