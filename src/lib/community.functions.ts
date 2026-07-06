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

export const markCommunityNotifRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid().optional(), all: z.boolean().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q: any = (supabase.from as any)("community_notifications").update({ is_read: true }).eq("user_id", userId);
    if (data.id) q = q.eq("id", data.id);
    const { error } = await q;
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const getProfileByUsername = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ username: z.string().min(1).max(60) }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: prof } = await (sb.from as any)("community_profiles")
      .select("id, username, display_name, avatar_url, bio, signature, rank, points, thread_count, post_count, created_at")
      .eq("username", data.username).maybeSingle();
    if (!prof) return { ok: false as const, error: "Not found" };
    const { data: threads } = await (sb.from as any)("community_threads")
      .select("id, title, slug, reply_count, score, created_at")
      .eq("author_id", prof.id).order("created_at", { ascending: false }).limit(20);
    return { ok: true as const, data: { profile: prof, threads: threads ?? [] } };
  });

export const updateCommunityProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    display_name: z.string().min(1).max(60).optional(),
    username: z.string().regex(/^[a-z0-9_]{3,30}$/).optional(),
    bio: z.string().max(500).optional(),
    signature: z.string().max(200).optional(),
    avatar_url: z.string().url().max(500).optional(),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await (supabase.from as any)("community_profiles")
      .update({ ...data, updated_at: new Date().toISOString() }).eq("id", userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const reportContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    targetType: z.enum(["thread", "post", "user"]),
    targetId: z.string().uuid(),
    reason: z.string().min(3).max(500),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await (supabase.from as any)("community_reports")
      .insert({ reporter_id: userId, target_type: data.targetType, target_id: data.targetId, reason: data.reason });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const listOpenReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isMod } = await (supabase.rpc as any)("is_community_mod", { _user_id: userId });
    if (!isMod) return { ok: false as const, error: "Forbidden" };
    const { data } = await (supabase.from as any)("community_reports")
      .select("*").eq("status", "open").order("created_at", { ascending: false }).limit(100);
    return { ok: true as const, data: data ?? [] };
  });

export const moderateThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    threadId: z.string().uuid(),
    action: z.enum(["lock", "unlock", "pin", "unpin", "delete"]),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isMod } = await (supabase.rpc as any)("is_community_mod", { _user_id: userId });
    if (!isMod) return { ok: false as const, error: "Forbidden" };
    const patch: any = {};
    if (data.action === "lock") patch.is_locked = true;
    if (data.action === "unlock") patch.is_locked = false;
    if (data.action === "pin") patch.is_pinned = true;
    if (data.action === "unpin") patch.is_pinned = false;
    if (data.action === "delete") patch.is_deleted = true;
    const { error } = await (supabase.from as any)("community_threads").update(patch).eq("id", data.threadId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const resolveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ reportId: z.string().uuid(), status: z.enum(["resolved", "dismissed"]) }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isMod } = await (supabase.rpc as any)("is_community_mod", { _user_id: userId });
    if (!isMod) return { ok: false as const, error: "Forbidden" };
    const { error } = await (supabase.from as any)("community_reports")
      .update({ status: data.status })
      .eq("id", data.reportId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const unreadCommunityCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { count } = await (supabase.from as any)("community_notifications")
      .select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_read", false);
    return { ok: true as const, data: { count: count ?? 0 } };
  });

// ---- Bookmarks --------------------------------------------------------
export const toggleBookmark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ threadId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await (supabase.from as any)("community_bookmarks")
      .select("id").eq("user_id", userId).eq("thread_id", data.threadId).maybeSingle();
    if (existing) {
      await (supabase.from as any)("community_bookmarks").delete().eq("id", existing.id);
      return { ok: true as const, data: { bookmarked: false } };
    }
    const { error } = await (supabase.from as any)("community_bookmarks")
      .insert({ user_id: userId, thread_id: data.threadId });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, data: { bookmarked: true } };
  });

export const isBookmarked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ threadId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await (supabase.from as any)("community_bookmarks")
      .select("id").eq("user_id", userId).eq("thread_id", data.threadId).maybeSingle();
    return { ok: true as const, data: { bookmarked: !!existing } };
  });

export const listMyBookmarks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await (supabase.from as any)("community_bookmarks")
      .select("thread_id, created_at, community_threads(id, title, slug, reply_count, score, created_at)")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
    return { ok: true as const, data: data ?? [] };
  });

// ---- Accept answer ----------------------------------------------------
export const acceptAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ threadId: z.string().uuid(), postId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: thread } = await (supabase.from as any)("community_threads").select("author_id, accepted_post_id").eq("id", data.threadId).maybeSingle();
    if (!thread) return { ok: false as const, error: "Thread not found" };
    if (thread.author_id !== userId) return { ok: false as const, error: "Only the thread author can accept" };
    if (thread.accepted_post_id === data.postId) {
      await (supabase.from as any)("community_threads").update({ accepted_post_id: null }).eq("id", data.threadId);
      return { ok: true as const, data: { accepted: null } };
    }
    const { data: post } = await (supabase.from as any)("community_posts").select("author_id").eq("id", data.postId).maybeSingle();
    if (!post) return { ok: false as const, error: "Reply not found" };
    await (supabase.from as any)("community_threads").update({ accepted_post_id: data.postId }).eq("id", data.threadId);
    if (post.author_id && post.author_id !== userId) {
      await (supabase.rpc as any)("community_bump_points", { _user: post.author_id, _delta: 5 });
      await (supabase.from as any)("community_notifications").insert({
        user_id: post.author_id, type: "accepted",
        payload: { thread_id: data.threadId, post_id: data.postId },
      });
    }
    return { ok: true as const, data: { accepted: data.postId } };
  });

// ---- Moderation target snippet ----------------------------------------
export const getReportTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ targetType: z.enum(["thread","post","user"]), targetId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isMod } = await (supabase.rpc as any)("is_community_mod", { _user_id: userId });
    if (!isMod) return { ok: false as const, error: "Forbidden" };
    if (data.targetType === "thread") {
      const { data: t } = await (supabase.from as any)("community_threads").select("id, title, body_md, author_id, is_locked, is_pinned").eq("id", data.targetId).maybeSingle();
      return { ok: true as const, data: { kind: "thread", target: t } };
    }
    if (data.targetType === "post") {
      const { data: p } = await (supabase.from as any)("community_posts").select("id, body_md, author_id, thread_id").eq("id", data.targetId).maybeSingle();
      return { ok: true as const, data: { kind: "post", target: p } };
    }
    const { data: u } = await (supabase.from as any)("community_profiles").select("id, username, display_name, rank, points").eq("id", data.targetId).maybeSingle();
    return { ok: true as const, data: { kind: "user", target: u } };
  });

export const listReportsByStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ status: z.enum(["open","resolved","dismissed"]).default("open") }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isMod } = await (supabase.rpc as any)("is_community_mod", { _user_id: userId });
    if (!isMod) return { ok: false as const, error: "Forbidden" };
    const { data: rows } = await (supabase.from as any)("community_reports")
      .select("*").eq("status", data.status).order("created_at", { ascending: false }).limit(100);
    return { ok: true as const, data: rows ?? [] };
  });
