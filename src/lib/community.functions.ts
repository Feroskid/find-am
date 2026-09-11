import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const API_BASE = "https://api.find-am.com";

export type ApiResult<T = any> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

async function call<T = any>(
  path: string,
  init: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<ApiResult<T>> {
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    if (init.token) headers["Authorization"] = `Bearer ${init.token}`;
    const res = await fetch(`${API_BASE}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const text = await res.text();
    let parsed: any = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = { detail: text };
    }
    if (!res.ok) {
      const detail =
        (parsed && (parsed.detail || parsed.message || parsed.error)) ||
        `Request failed (${res.status})`;
      const msg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => d?.msg || JSON.stringify(d)).join(", ")
            : JSON.stringify(detail);
      return { ok: false, status: res.status, error: msg };
    }
    return { ok: true, data: (parsed ?? {}) as T };
  } catch (e: any) {
    return { ok: false, status: 0, error: e?.message || "Network error" };
  }
}

const Token = z.string().min(8).max(4096);
const OptToken = Token.nullish();
const Id = z.string().min(1).max(64);
const Username = z.string().min(3).max(20);
const Page = z.number().int().min(1).max(500).optional();
const PerPage = z.number().int().min(1).max(50).optional();

function qs(params: Record<string, string | number | undefined>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") s.set(k, String(v));
  const out = s.toString();
  return out ? `?${out}` : "";
}

// ---- Identity and profile ----------------------------------------------
export const getCommunityMe = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) => call("/community/me", { token: data.token }));

export const setCommunityUsername = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token, username: Username }).parse(i))
  .handler(async ({ data }) =>
    call("/community/username", { method: "POST", token: data.token, body: { username: data.username } }),
  );

export const updateCommunityProfile = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        token: Token,
        bio: z.string().max(1000).optional(),
        signature: z.string().max(300).optional(),
        avatar_key: z.string().regex(/^a\d{2}$/).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { token, ...body } = data;
    return call("/community/profile", { method: "PATCH", token, body });
  });

export const getCommunityProfile = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ username: Username, token: OptToken }).parse(i))
  .handler(async ({ data }) =>
    call(`/community/u/${encodeURIComponent(data.username)}`, { token: data.token ?? null }),
  );

// ---- Categories and threads --------------------------------------------
export const listCategories = createServerFn({ method: "GET" }).handler(async () =>
  call("/community/categories"),
);

export const listCategoryThreads = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        slug: z.string().min(1).max(64),
        page: Page,
        perPage: PerPage,
        sort: z.enum(["latest", "top"]).optional(),
        token: OptToken,
      })
      .parse(i),
  )
  .handler(async ({ data }) =>
    call(
      `/community/c/${encodeURIComponent(data.slug)}${qs({ page: data.page, per_page: data.perPage, sort: data.sort })}`,
      { token: data.token ?? null },
    ),
  );

export const getThread = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ threadId: Id, page: Page, perPage: PerPage, token: OptToken }).parse(i),
  )
  .handler(async ({ data }) =>
    call(
      `/community/threads/${encodeURIComponent(data.threadId)}${qs({ page: data.page, per_page: data.perPage })}`,
      { token: data.token ?? null },
    ),
  );

export const createThread = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        token: Token,
        category_slug: z.string().min(1).max(64),
        title: z.string().min(5).max(150),
        body_md: z.string().min(1).max(10000),
        tags: z.array(z.string().regex(/^[a-z0-9-]+$/).max(24)).max(5).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { token, ...body } = data;
    return call("/community/threads", { method: "POST", token, body });
  });

export const updateThread = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        token: Token,
        threadId: Id,
        title: z.string().min(5).max(150).optional(),
        body_md: z.string().min(1).max(10000).optional(),
        tags: z.array(z.string().max(24)).max(5).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { token, threadId, ...body } = data;
    return call(`/community/threads/${encodeURIComponent(threadId)}`, { method: "PATCH", token, body });
  });

export const deleteThread = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token, threadId: Id }).parse(i))
  .handler(async ({ data }) =>
    call(`/community/threads/${encodeURIComponent(data.threadId)}`, { method: "DELETE", token: data.token }),
  );

export const replyToThread = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({ token: Token, threadId: Id, body_md: z.string().min(1).max(5000), parent_id: Id.optional() })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { token, threadId, ...body } = data;
    return call(`/community/threads/${encodeURIComponent(threadId)}/posts`, { method: "POST", token, body });
  });

export const updatePost = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ token: Token, postId: Id, body_md: z.string().min(1).max(5000) }).parse(i),
  )
  .handler(async ({ data }) =>
    call(`/community/posts/${encodeURIComponent(data.postId)}`, {
      method: "PATCH",
      token: data.token,
      body: { body_md: data.body_md },
    }),
  );

export const deletePost = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token, postId: Id }).parse(i))
  .handler(async ({ data }) =>
    call(`/community/posts/${encodeURIComponent(data.postId)}`, { method: "DELETE", token: data.token }),
  );

export const acceptAnswer = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token, threadId: Id, postId: Id }).parse(i))
  .handler(async ({ data }) =>
    call(
      `/community/threads/${encodeURIComponent(data.threadId)}/accept/${encodeURIComponent(data.postId)}`,
      { method: "POST", token: data.token },
    ),
  );

// ---- Votes, bookmarks, notifications, search ---------------------------
export const voteOn = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        token: Token,
        target_type: z.enum(["thread", "post"]),
        target_id: Id,
        value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { token, ...body } = data;
    return call("/community/vote", { method: "POST", token, body });
  });

export const toggleBookmark = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token, threadId: Id }).parse(i))
  .handler(async ({ data }) =>
    call(`/community/bookmarks/${encodeURIComponent(data.threadId)}`, { method: "POST", token: data.token }),
  );

export const listBookmarks = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token, page: Page, perPage: PerPage }).parse(i))
  .handler(async ({ data }) =>
    call(`/community/bookmarks${qs({ page: data.page, per_page: data.perPage })}`, { token: data.token }),
  );

export const listNotifications = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token, page: Page, perPage: PerPage }).parse(i))
  .handler(async ({ data }) =>
    call(`/community/notifications${qs({ page: data.page, per_page: data.perPage })}`, { token: data.token }),
  );

export const markNotificationsRead = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token, ids: z.array(Id).max(200).optional() }).parse(i))
  .handler(async ({ data }) =>
    call("/community/notifications/read", {
      method: "POST",
      token: data.token,
      body: data.ids ? { ids: data.ids } : {},
    }),
  );

export const searchCommunity = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ q: z.string().min(1).max(200), page: Page, perPage: PerPage, token: OptToken }).parse(i),
  )
  .handler(async ({ data }) =>
    call(`/community/search${qs({ q: data.q, page: data.page, per_page: data.perPage })}`, {
      token: data.token ?? null,
    }),
  );

// ---- Images -------------------------------------------------------------
export const uploadCommunityImage = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        token: Token,
        filename: z.string().min(1).max(200),
        contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        dataBase64: z.string().min(1).max(9_000_000),
      })
      .parse(i),
  )
  .handler(async ({ data }): Promise<ApiResult> => {
    try {
      const bin = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
      const form = new FormData();
      form.append("file", new Blob([bin], { type: data.contentType }), data.filename);
      const res = await fetch(`${API_BASE}/community/images`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${data.token}` },
        body: form,
      });
      const text = await res.text();
      let parsed: any = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = { detail: text };
      }
      if (!res.ok) {
        const detail = (parsed && (parsed.detail || parsed.message)) || `Upload failed (${res.status})`;
        return { ok: false, status: res.status, error: typeof detail === "string" ? detail : JSON.stringify(detail) };
      }
      return { ok: true, data: parsed ?? {} };
    } catch (e: any) {
      return { ok: false, status: 0, error: e?.message || "Upload failed" };
    }
  });

// ---- Reporting ----------------------------------------------------------
export const reportContent = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        token: Token,
        target_type: z.enum(["thread", "post", "user"]),
        target_id: z.string().min(1).max(64),
        reason: z.string().min(3).max(500),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { token, ...body } = data;
    return call("/community/report", { method: "POST", token, body });
  });

// ---- Moderation ---------------------------------------------------------
export const listModReports = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({ token: Token, status: z.enum(["open", "resolved", "dismissed"]).optional(), page: Page })
      .parse(i),
  )
  .handler(async ({ data }) =>
    call(`/community/mod/reports${qs({ status: data.status, page: data.page })}`, { token: data.token }),
  );

export const resolveModReport = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        token: Token,
        reportId: Id,
        status: z.enum(["resolved", "dismissed"]),
        note: z.string().max(500).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) =>
    call(`/community/mod/reports/${encodeURIComponent(data.reportId)}`, {
      method: "POST",
      token: data.token,
      body: { status: data.status, note: data.note },
    }),
  );

export const moderateThread = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        token: Token,
        threadId: Id,
        action: z.enum(["hide", "unhide", "pin", "unpin", "lock", "unlock"]),
        reason: z.string().max(500).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) =>
    call(`/community/mod/threads/${encodeURIComponent(data.threadId)}`, {
      method: "POST",
      token: data.token,
      body: { action: data.action, reason: data.reason },
    }),
  );

export const moderatePost = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        token: Token,
        postId: Id,
        action: z.enum(["hide", "unhide"]),
        reason: z.string().max(500).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) =>
    call(`/community/mod/posts/${encodeURIComponent(data.postId)}`, {
      method: "POST",
      token: data.token,
      body: { action: data.action, reason: data.reason },
    }),
  );

export const banMember = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ token: Token, username: Username, reason: z.string().max(500).optional() }).parse(i),
  )
  .handler(async ({ data }) =>
    call("/community/mod/ban", {
      method: "POST",
      token: data.token,
      body: { username: data.username, reason: data.reason },
    }),
  );

export const unbanMember = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token, username: Username }).parse(i))
  .handler(async ({ data }) =>
    call("/community/mod/unban", { method: "POST", token: data.token, body: { username: data.username } }),
  );

export const listCommunityRoles = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) => call("/community/admin/roles", { token: data.token }));

export const grantCommunityRole = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        token: Token,
        username: Username,
        role: z.enum(["moderator", "super_moderator"]),
        category_slug: z.string().max(64).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { token, ...body } = data;
    return call("/community/admin/roles", { method: "POST", token, body });
  });

export const revokeCommunityRole = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        token: Token,
        username: Username,
        role: z.enum(["moderator", "super_moderator"]),
        category_slug: z.string().max(64).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { token, ...body } = data;
    return call("/community/admin/roles", { method: "DELETE", token, body });
  });
