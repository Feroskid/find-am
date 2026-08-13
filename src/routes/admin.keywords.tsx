import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Trash2, SpellCheck2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { adminAddBannedKeyword, adminRemoveBannedKeyword } from "@/lib/findtask.functions";

export const Route = createFileRoute("/admin/keywords")({
  head: () => ({ meta: [{ title: "Banned keywords — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminKeywordsPage,
});

const CATEGORIES = ["contact", "offsite_payment", "scam", "abuse", "illegal", "other"];

function AdminKeywordsPage() {
  const { token } = useAuth();
  const addFn = useServerFn(adminAddBannedKeyword);
  const rmFn = useServerFn(adminRemoveBannedKeyword);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [keywordId, setKeywordId] = useState("");
  const [added, setAdded] = useState<{ id?: string; keyword: string; category: string }[]>([]);

  const add = useMutation({
    mutationFn: () => addFn({ data: { keyword: keyword.trim(), category, token: token! } }),
    onSuccess: (r: any) => {
      if (r?.ok) {
        const id = r.data?.keyword_id ?? r.data?.id;
        toast.success(id ? `Keyword added (id ${id})` : "Keyword added");
        setAdded((a) => [{ id: id ? String(id) : undefined, keyword: keyword.trim(), category }, ...a]);
        setKeyword("");
      } else toast.error(r?.error ?? "Could not add keyword");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => rmFn({ data: { keywordId: id, token: token! } }),
    onSuccess: (r: any, id) => {
      if (r?.ok) { toast.success("Keyword removed"); setAdded((a) => a.filter((k) => k.id !== id)); setKeywordId(""); }
      else toast.error(r?.error ?? "Could not remove keyword");
    },
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="font-display text-xl text-ink inline-flex items-center gap-2"><SpellCheck2 className="h-5 w-5 text-primary" /> Banned keywords</h2>
        <p className="text-sm text-muted-foreground">Words that flag a message for review — for example attempts to move payment off-platform.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Keyword or phrase</label>
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. pay me directly" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
            </select>
          </div>
        </div>
        <button
          disabled={keyword.trim().length < 2 || add.isPending}
          onClick={() => add.mutate()}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add keyword
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-ink">Remove a keyword</h3>
        <p className="text-xs text-muted-foreground">Keyword IDs appear in flagged-message records and when a keyword is added.</p>
        <div className="flex gap-2">
          <input value={keywordId} onChange={(e) => setKeywordId(e.target.value.replace(/[^\d]/g, ""))} placeholder="Keyword ID" className="w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <button
            disabled={!keywordId || remove.isPending}
            onClick={() => remove.mutate(keywordId)}
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 text-destructive px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-destructive/10"
          >
            {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Remove
          </button>
        </div>
      </div>

      {added.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-semibold text-ink text-sm">Added in this session</h3>
          <ul className="mt-2 space-y-1.5">
            {added.map((k, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm">
                <span>“{k.keyword}” · <span className="text-muted-foreground">{k.category}</span>{k.id ? ` · id ${k.id}` : ""}</span>
                {k.id && (
                  <button onClick={() => remove.mutate(k.id!)} className="text-xs text-destructive underline">remove</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
