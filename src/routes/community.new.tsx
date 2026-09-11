import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { listCategories, createThread, uploadCommunityImage } from "@/lib/community.functions";
import { useCommunityMe, communityError } from "@/lib/community-client";

const SearchSchema = z.object({ category: z.string().optional() });

export const Route = createFileRoute("/community/new")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Start a discussion — Find-Task Community" },
      { name: "description", content: "Ask a question or share what works with other Find-Task members." },
    ],
  }),
  component: NewThreadPage,
});

const MAX_IMAGES = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp"];

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("Could not read that file"));
    r.readAsDataURL(file);
  });
}

function NewThreadPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const c = useCommunityMe();
  const catsFn = useServerFn(listCategories);
  const createFn = useServerFn(createThread);
  const uploadFn = useServerFn(uploadCommunityImage);
  const fileRef = useRef<HTMLInputElement>(null);

  const catsQ = useQuery({ queryKey: ["community", "categories"], queryFn: () => catsFn() });
  const cats: any[] = catsQ.data?.ok ? ((catsQ.data.data as any).categories ?? []) : [];

  const [category, setCategory] = useState<string>(search.category ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagText, setTagText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (c.ready && !c.signedIn) navigate({ to: "/login" });
    else if (c.needsUsername) navigate({ to: "/community/username" });
  }, [c.ready, c.signedIn, c.needsUsername, navigate]);

  useEffect(() => {
    if (!category && cats.length) setCategory(cats[0].slug);
  }, [cats, category]);

  const tags = tagText
    .split(/[,\s]+/)
    .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""))
    .filter(Boolean)
    .slice(0, 5);

  const attach = async (file: File) => {
    if (images.length >= MAX_IMAGES) return toast.error("Three images per post is the limit.");
    if (!OK_TYPES.includes(file.type)) return toast.error("Only JPG, PNG or WebP images.");
    if (file.size > MAX_BYTES) return toast.error("That image is over 5MB.");
    setUploading(true);
    try {
      const dataBase64 = await toBase64(file);
      const r = await uploadFn({
        data: { token: c.token!, filename: file.name, contentType: file.type as any, dataBase64 },
      });
      if (!r.ok) return toast.error(communityError(r));
      const url = (r.data as any).url;
      setImages((prev) => [...prev, url]);
      setBody((prev) => `${prev}${prev && !prev.endsWith("\n") ? "\n" : ""}![image](${url})\n`);
      toast.success("Image added");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          token: c.token!,
          category_slug: category,
          title: title.trim(),
          body_md: body.trim(),
          tags: tags.length ? tags : undefined,
        },
      }),
    onSuccess: (r) => {
      if (!r.ok) return toast.error(communityError(r));
      toast.success("Thread posted (+2 pts)");
      navigate({ to: "/community/t/$threadId", params: { threadId: String((r.data as any).id) }, search: { page: 1 } });
    },
  });

  const titleOk = title.trim().length >= 5 && title.trim().length <= 150;

  if (c.isBanned) {
    return (
      <CommunityShell>
        <p className="text-sm text-black/60 text-center py-16">Your community access is suspended, so you can't post right now.</p>
      </CommunityShell>
    );
  }

  return (
    <CommunityShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="font-bold text-2xl mb-4">Start a new thread</h1>
        <div className="rounded-2xl bg-white border border-black/10 p-5 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase text-black/60">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-black/15 p-2.5 text-sm outline-none focus:border-[#E5A54B] bg-white"
            >
              {cats.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase text-black/60">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              placeholder="What do you want to talk about?"
              className="mt-1 w-full rounded-lg border border-black/15 p-2.5 text-sm outline-none focus:border-[#E5A54B]"
            />
            <span className="text-[11px] text-black/40">{title.trim().length}/150 — at least 5 characters</span>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase text-black/60">Your post</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={9}
              maxLength={10000}
              placeholder="Share the details. Mention someone with @their_username."
              className="mt-1 w-full rounded-lg border border-black/15 p-3 text-sm outline-none focus:border-[#E5A54B]"
            />
            <span className="text-[11px] text-black/40">{body.length}/10000</span>
          </label>

          <div>
            <span className="text-xs font-semibold uppercase text-black/60">Images</span>
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {images.map((url) => (
                <div key={url} className="relative">
                  <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover border border-black/10" />
                  <button
                    type="button"
                    onClick={() => { setImages(images.filter((u) => u !== url)); setBody(body.replace(`![image](${url})`, "").trim()); }}
                    className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-black text-white"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-lg border border-dashed border-black/25 px-3 py-2 text-xs font-semibold hover:border-[#E5A54B] disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Add image
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) attach(f); }}
              />
            </div>
            <p className="text-[11px] text-black/40 mt-1">Up to 3 images, JPG/PNG/WebP, 5MB each.</p>
          </div>

          <label className="block">
            <span className="text-xs font-semibold uppercase text-black/60">Tags (optional)</span>
            <input
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
              placeholder="cleaning, lagos, pricing"
              className="mt-1 w-full rounded-lg border border-black/15 p-2.5 text-sm outline-none focus:border-[#E5A54B]"
            />
            {tags.length > 0 && (
              <span className="mt-1 flex gap-1 flex-wrap">
                {tags.map((t) => <span key={t} className="text-[11px] rounded bg-black/5 px-2 py-0.5">#{t}</span>)}
              </span>
            )}
          </label>

          <div className="flex items-center justify-between">
            <Link to="/community" className="text-sm text-black/60 hover:underline">Cancel</Link>
            <button
              disabled={!titleOk || !body.trim() || !category || create.isPending}
              onClick={() => create.mutate()}
              className="rounded-lg bg-[#E5A54B] text-white px-5 py-2.5 font-bold text-sm disabled:opacity-50"
            >
              {create.isPending ? "Posting…" : "Post thread"}
            </button>
          </div>
        </div>
      </div>
    </CommunityShell>
  );
}
