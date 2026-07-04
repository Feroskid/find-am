import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await (sb.from as any)("community_categories")
    .select("id, slug, name, description, icon, sort_order, thread_count, post_count")
    .order("sort_order", { ascending: true });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, data: data ?? [] };
});

export const listLatestThreads = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ limit: z.number().int().min(1).max(50).default(20) }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rows, error } = await (sb.from as any)("community_threads")
      .select("id, title, slug, category_id, author_id, reply_count, score, last_reply_at, created_at, is_pinned")
      .order("is_pinned", { ascending: false })
      .order("last_reply_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, data: rows ?? [] };
  });

export const listThreadsByCategory = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ slug: z.string().min(1).max(80), limit: z.number().int().min(1).max(100).default(40) }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: cat } = await (sb.from as any)("community_categories").select("*").eq("slug", data.slug).maybeSingle();
    if (!cat) return { ok: false as const, error: "Category not found" };
    const { data: rows, error } = await (sb.from as any)("community_threads")
      .select("id, title, slug, author_id, reply_count, score, last_reply_at, created_at, is_pinned, is_locked")
      .eq("category_id", cat.id)
      .order("is_pinned", { ascending: false })
      .order("last_reply_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, data: { category: cat, threads: rows ?? [] } };
  });

export const getThread = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ threadId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: thread, error } = await (sb.from as any)("community_threads").select("*").eq("id", data.threadId).maybeSingle();
    if (error || !thread) return { ok: false as const, error: error?.message ?? "Not found" };
    const { data: posts } = await (sb.from as any)("community_posts")
      .select("id, author_id, body_md, score, parent_id, created_at, edited_at, is_deleted")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    const authorIds = Array.from(new Set([thread.author_id, ...(posts ?? []).map((p: any) => p.author_id)]));
    const { data: profiles } = await (sb.from as any)("community_profiles")
      .select("id, username, display_name, avatar_url, rank, points")
      .in("id", authorIds);
    return { ok: true as const, data: { thread, posts: posts ?? [], profiles: profiles ?? [] } };
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    categorySlug: z.string().min(1).max(80),
    title: z.string().min(4).max(200),
    body: z.string().min(4).max(20000),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: cat } = await (supabase.from as any)("community_categories").select("id").eq("slug", data.categorySlug).maybeSingle();
    if (!cat) return { ok: false as const, error: "Category not found" };
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "thread";
    const { data: row, error } = await (supabase.from as any)("community_threads")
      .insert({ category_id: cat.id, author_id: userId, title: data.title, slug, body_md: data.body })
      .select("id, slug")
      .single();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, data: row };
  });

export const replyToThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    threadId: z.string().uuid(),
    body: z.string().min(1).max(20000),
    parentId: z.string().uuid().optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await (supabase.from as any)("community_posts")
      .insert({ thread_id: data.threadId, author_id: userId, parent_id: data.parentId ?? null, body_md: data.body })
      .select("id").single();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, data: row };
  });

export const voteOn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    targetType: z.enum(["thread", "post"]),
    targetId: z.string().uuid(),
    value: z.number().int().min(-1).max(1),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.value === 0) {
      await (supabase.from as any)("community_votes").delete()
        .eq("user_id", userId).eq("target_type", data.targetType).eq("target_id", data.targetId);
      return { ok: true as const, data: { value: 0 } };
    }
    const { error } = await (supabase.from as any)("community_votes")
      .upsert({ user_id: userId, target_type: data.targetType, target_id: data.targetId, value: data.value }, { onConflict: "user_id,target_type,target_id" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, data: { value: data.value } };
  });

export const getMyCommunityProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await (supabase.from as any)("community_profiles").select("*").eq("id", userId).maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, data };
  });

export const searchCommunity = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ q: z.string().min(2).max(120) }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const q = data.q.replace(/[^\w\s]/g, " ").trim();
    const { data: threads } = await (sb.from as any)("community_threads")
      .select("id, title, slug, reply_count, score, created_at")
      .textSearch("search_tsv", q, { type: "websearch" })
      .limit(25);
    return { ok: true as const, data: { threads: threads ?? [] } };
  });

export const listMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await (supabase.from as any)("community_notifications")
      .select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, data: data ?? [] };
  });
