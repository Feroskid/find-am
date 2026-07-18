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
const TaskId = z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]);
const TaskerId = z.union([z.number().int().positive(), z.string().min(1).max(64)]);
const UserId = z.union([z.number().int().positive(), z.string().min(1).max(64)]);
const MilestoneId = z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]);

// ---- Categories ---------------------------------------------------------
export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => call("/task/categories"),
);

export const getSubCategories = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ parentId: z.number().int().positive() }).parse(i))
  .handler(async ({ data }) => call(`/task/categories?parent=${data.parentId}`));

// ---- Auth helpers -------------------------------------------------------
export const verifyEmail = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: z.string().min(1).max(4096) }).parse(i))
  .handler(async ({ data }) =>
    call(`/auth/verify-email`, { method: "POST", body: { token: data.token } }),
  );

export const resendVerification = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ email: z.string().email().max(200).optional(), token: Token }).parse(i),
  )
  .handler(async ({ data }) =>
    call(`/auth/resend-verification`, { method: "POST", token: data.token }),
  );

export const checkEmailVerification = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) => {
    const res = await call(`/auth/resend-verification`, { method: "POST", token: data.token });
    if (res.ok) return { ok: true as const, data: { verified: false, resent: true } };
    if (/already\s+verified/i.test(res.error)) {
      return { ok: true as const, data: { verified: true, resent: false } };
    }
    return res;
  });

export const forgotPassword = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ email: z.string().email().max(200) }).parse(i))
  .handler(async ({ data }) =>
    call(`/auth/forgot-password`, { method: "POST", body: { email: data.email } }),
  );

export const resetPassword = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      token: z.string().min(4).max(512),
      new_password: z.string().min(6).max(200),
    }).parse(i),
  )
  .handler(async ({ data }) =>
    call(`/auth/reset-password`, {
      method: "POST",
      body: { token: data.token, new_password: data.new_password },
    }),
  );

export const registerBank = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      bank_code: z.string().min(2).max(20),
      account_number: z.string().min(5).max(20),
      account_name: z.string().min(2).max(120),
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { token, ...body } = data;
    return call(`/auth/register-bank`, { method: "POST", body, token });
  });

// ---- Browse / search tasks ---------------------------------------------
const BrowseSchema = z.object({
  q: z.string().max(200).optional(),
  category_id: z.number().int().positive().optional(),
  location: z.string().max(160).optional(),
  is_remote: z.union([z.literal(0), z.literal(1)]).optional(),
  page: z.number().int().min(1).max(500).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  min_budget: z.number().int().nonnegative().optional(),
  max_budget: z.number().int().positive().optional(),
  sort: z.enum(["recent", "budget_desc", "budget_asc", "random"]).optional(),
  since_days: z.number().int().min(1).max(365).optional(),
});
export const listTasks = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => BrowseSchema.parse(i))
  .handler(async ({ data }) => {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && v !== null) params.set(k, String(v));
    });
    const qs = params.toString();
    return call(`/task/search${qs ? `?${qs}` : ""}`);
  });

// ---- Single task --------------------------------------------------------
export const getTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: TaskId }).parse(i))
  .handler(async ({ data }) => call(`/task/${data.taskId}`));

// ---- Create task --------------------------------------------------------
// API spec (TaskPost): title, description, budget, category_id, location_text,
// location_lat, location_lng, is_remote, deadline, quantity, is_milestone, milestones[].
const CreateTaskSchema = z.object({
  title: z.string().min(4).max(140),
  description: z.string().min(10).max(4000),
  budget: z.number().positive().max(100_000_000),
  category_id: z.number().int().positive().optional(),
  location_text: z.string().min(2).max(160).optional(),
  state: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  is_remote: z.union([z.literal(0), z.literal(1)]).optional(),
  deadline: z.string().max(64).optional(),
  quantity: z.number().int().min(1).max(99).optional(),
  urgency: z.enum(["low", "normal", "high", "urgent"]).optional(),
  milestones: z
    .array(z.object({ title: z.string().min(1).max(140), amount: z.number().positive() }))
    .max(20)
    .optional(),
  token: Token,
});
export const createTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => CreateTaskSchema.parse(i))
  .handler(async ({ data }) => {
    const { token, latitude, longitude, milestones, state, city, location_text, ...rest } = data;
    const body: Record<string, unknown> = { ...rest };
    if (latitude !== undefined) body.location_lat = latitude;
    if (longitude !== undefined) body.location_lng = longitude;
    // Compose a display location_text if not supplied so on-site tasks always show one.
    const composed = location_text ?? [city, state].filter(Boolean).join(", ");
    if (composed) body.location_text = composed;
    if (milestones && milestones.length > 0) {
      body.milestones = milestones;
      body.is_milestone = 1;
      body.quantity = 1;
    }
    return call("/task/post", { method: "POST", body, token });
  });

// ---- Apply --------------------------------------------------------------
export const applyToTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      taskId: TaskId,
      message: z.string().min(2).max(2000).optional(),
      earliest_start: z.string().max(64).optional(),
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const body: Record<string, unknown> = { message: data.message ?? "" };
    if (data.earliest_start) body.earliest_start = data.earliest_start;
    const res = await call(`/task/${data.taskId}/apply`, {
      method: "POST",
      body,
      token: data.token,
    });
    if (!res.ok && res.status >= 500) {
      return {
        ok: false as const,
        status: res.status,
        error: "The offer could not be submitted because the task service returned a server error. Please try again shortly.",
      };
    }
    return res;
  });

// ---- Tasker's own applications -----------------------------------------
export const getMyApplications = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) => call(`/my-applications`, { token: data.token }));

// ---- Conversations inbox -----------------------------------------------
export const getMyConversations = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) => call(`/my-conversations`, { token: data.token }));

// ---- Applications (poster) ---------------------------------------------
export const listTaskApplications = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: TaskId, token: Token }).parse(i))
  .handler(async ({ data }) =>
    call(`/task/${data.taskId}/applications`, { token: data.token }),
  );

// ---- Accept tasker (PUT) -----------------------------------------------
// Backend may return a payment_url / authorization_url for Flutterwave.
export const acceptApplicant = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ taskId: TaskId, taskerId: TaskerId, token: Token }).parse(i),
  )
  .handler(async ({ data }) =>
    call(`/task/${data.taskId}/accept/${data.taskerId}`, {
      method: "PUT",
      token: data.token,
    }),
  );

// ---- Complete -----------------------------------------------------------
export const completeTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: TaskId, token: Token }).parse(i))
  .handler(async ({ data }) =>
    call(`/task/${data.taskId}/complete`, { method: "POST", token: data.token }),
  );

// ---- Dispute ------------------------------------------------------------
export const disputeTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      taskId: TaskId,
      reason: z.string().min(5).max(2000),
      evidence_urls: z.array(z.string().url().max(2048)).max(10).optional(),
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const body: Record<string, unknown> = { reason: data.reason };
    if (data.evidence_urls?.length) body.evidence_urls = data.evidence_urls;
    return call(`/task/${data.taskId}/dispute`, {
      method: "POST",
      body,
      token: data.token,
    });
  });

// ---- Report task --------------------------------------------------------
export const reportTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      taskId: TaskId,
      reason: z.string().min(3).max(500),
      description: z.string().max(2000).optional(),
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { taskId, token, ...body } = data;
    return call(`/task/${taskId}/report`, { method: "POST", body, token });
  });

// ---- Rate ---------------------------------------------------------------
export const rateTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      taskId: TaskId,
      rating: z.number().int().min(1).max(5),
      review_text: z.string().max(2000).optional(),
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) =>
    call(`/task/${data.taskId}/rate`, {
      method: "POST",
      body: { rating: data.rating, review_text: data.review_text ?? null },
      token: data.token,
    }),
  );

// ---- Messages -----------------------------------------------------------
export const listMessages = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: TaskId, token: Token }).parse(i))
  .handler(async ({ data }) =>
    call(`/task/${data.taskId}/messages`, { token: data.token }),
  );

export const sendMessage = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      taskId: TaskId,
      message_text: z.string().min(1).max(4000),
      attachment_url: z.string().url().max(2048).optional(),
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { taskId, token, ...body } = data;
    return call(`/task/${taskId}/message`, { method: "POST", body, token });
  });

// ---- Milestones ---------------------------------------------------------
export const getMilestones = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: TaskId, token: Token.optional() }).parse(i))
  .handler(async ({ data }) => call(`/task/${data.taskId}/milestones`, { token: data.token }));

export const completeMilestone = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ taskId: TaskId, milestoneId: MilestoneId, token: Token }).parse(i),
  )
  .handler(async ({ data }) =>
    call(`/task/${data.taskId}/milestone/${data.milestoneId}/complete`, {
      method: "POST",
      token: data.token,
    }),
  );

export const releaseMilestone = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ taskId: TaskId, milestoneId: MilestoneId, token: Token }).parse(i),
  )
  .handler(async ({ data }) =>
    call(`/task/${data.taskId}/milestone/${data.milestoneId}/release`, {
      method: "POST",
      token: data.token,
    }),
  );

// ---- Notifications ------------------------------------------------------
export const listNotifications = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) => call(`/notifications`, { token: data.token }));

export const unreadCount = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) =>
    call(`/notifications/unread-count`, { token: data.token }),
  );

export const markNotificationRead = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ id: z.union([z.string(), z.number()]), token: Token }).parse(i),
  )
  .handler(async ({ data }) =>
    call(`/notifications/${data.id}/read`, { method: "POST", token: data.token }),
  );

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) =>
    call(`/notifications/read-all`, { method: "POST", token: data.token }),
  );

// ---- Wallet -------------------------------------------------------------
export const walletBalance = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) => call(`/wallet/balance`, { token: data.token }));

// /wallet/transactions is not in the OpenAPI spec; the /wallet/balance
// response often embeds recent ledger entries. We try the dedicated endpoint
// and gracefully fall back to whatever ships with /wallet/balance.
export const walletTransactions = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) => {
    const r = await call(`/wallet/transactions`, { token: data.token });
    if (r.ok || r.status !== 404) return r;
    const b = await call(`/wallet/balance`, { token: data.token });
    if (!b.ok) return b;
    const bd: any = b.data ?? {};
    const list = bd.transactions ?? bd.recent ?? bd.history ?? [];
    return { ok: true as const, data: { transactions: list } };
  });

export const withdrawFunds = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      amount: z.number().positive().max(100_000_000),
      bank_code: z.string().min(2).max(20).optional(),
      account_number: z.string().min(5).max(20).optional(),
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { token, ...body } = data;
    return call(`/wallet/withdraw`, { method: "POST", body, token });
  });

export const listBanks = createServerFn({ method: "GET" }).handler(
  async () => call(`/banks`),
);

export const verifyKyc = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      bvn: z.string().regex(/^\d{11}$/, "BVN must be 11 digits"),
      bank_code: z.string().min(2).max(20),
      account_number: z.string().min(5).max(20),
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { token, ...body } = data;
    return call(`/wallet/verify-kyc`, { method: "POST", body, token });
  });

// ---- Profile (self) ----------------------------------------------------
export const getMe = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) => call(`/auth/me`, { token: data.token }));

const ProfileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  photo_url: z.string().url().max(2048).optional(),
  location: z.string().max(160).optional(),
  state: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  tagline: z.string().max(200).optional(),
  about: z.string().max(2000).optional(),
  categories: z.array(z.number().int().positive()).max(20).optional(),
  token: Token,
});
export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => ProfileSchema.parse(i))
  .handler(async ({ data }) => {
    const { token, ...body } = data;
    return call(`/auth/profile`, { method: "PUT", body, token });
  });

// ---- Public user --------------------------------------------------------
// The only spec'd public-user endpoint is /user/{user_id}/profile. Tasks and
// ratings come embedded in that response.
export const getPublicUser = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ userId: UserId, token: Token.optional() }).parse(i))
  .handler(async ({ data }) => call(`/user/${data.userId}/profile`, { token: data.token }));


// Legacy aliases kept so existing UI keeps compiling. Both now return
// the relevant slice of /user/{id}/profile.
export const getUserRatings = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ userId: UserId }).parse(i))
  .handler(async ({ data }) => {
    const r = await call(`/user/${data.userId}/profile`);
    if (!r.ok) return r;
    const p: any = r.data ?? {};
    const ratings = p.ratings ?? p.profile?.ratings ?? [];
    const category_ratings = p.category_ratings ?? p.profile?.category_ratings ?? [];
    const badges = p.badges ?? p.profile?.badges ?? [];
    return { ok: true as const, data: { ratings, category_ratings, badges } };
  });

export const getUserTasks = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      userId: UserId,
      token: Token.optional(),
      role: z.enum(["poster", "tasker"]).optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    // Tasker's own activity: hydrate each application with its full task.
    if (data.role === "tasker" && data.token) {
      const r = await call(`/my-applications`, { token: data.token });
      if (r.ok) {
        const rd: any = r.data ?? {};
        const apps: any[] = rd.applications ?? rd.results ?? (Array.isArray(rd) ? rd : []);
        const hydrated = await Promise.all(
          apps.map(async (a: any) => {
            const embedded = a.task ?? null;
            const tid = embedded?.task_id ?? embedded?.id ?? a.task_id;
            let full: any = embedded;
            if (tid && (!embedded?.title || embedded?.title === "Untitled task")) {
              const tr = await call(`/task/${tid}`);
              if (tr.ok) full = (tr.data as any)?.task ?? tr.data ?? embedded;
            }
            // Carry the application status alongside the task status.
            return full ? { ...full, my_application_status: a.status ?? a.application_status } : null;
          }),
        );
        return { ok: true as const, data: { tasks: hydrated.filter(Boolean) } };
      }
    }
    // Poster path: combine profile-embedded tasks with paginated search filter.
    const collected = new Map<string, any>();
    const prof = await call(`/user/${data.userId}/profile`);
    if (prof.ok) {
      const p: any = prof.data ?? {};
      const tasks = p.tasks ?? p.profile?.tasks ?? p.posted_tasks ?? [];
      if (Array.isArray(tasks)) {
        tasks.forEach((t: any) => {
          const k = String(t.task_id ?? t.id ?? "");
          if (k) collected.set(k, t);
        });
      }
    }
    // Walk a few pages of /task/search to grab open tasks owned by this user.
    for (let page = 1; page <= 5; page++) {
      const search = await call(`/task/search?limit=50&page=${page}`);
      if (!search.ok) break;
      const list: any[] = (search.data as any)?.results ?? (search.data as any)?.tasks ?? [];
      if (!list.length) break;
      list.forEach((t: any) => {
        if (String(t?.poster_id ?? t?.user_id ?? t?.owner_id ?? "") === String(data.userId)) {
          const k = String(t.task_id ?? t.id ?? "");
          if (k) collected.set(k, { ...(collected.get(k) ?? {}), ...t });
        }
      });
      if (list.length < 50) break;
    }
    return { ok: true as const, data: { tasks: Array.from(collected.values()) } };
  });


// ---- Task lifecycle: cancel --------------------------------------------
export const cancelTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ taskId: TaskId, token: Token, reason: z.string().max(500).optional() }).parse(i),
  )
  .handler(async ({ data }) =>
    call(`/task/${data.taskId}/cancel`, {
      method: "POST",
      token: data.token,
      body: data.reason ? { reason: data.reason } : undefined,
    }),
  );

// ---- Live location -----------------------------------------------------
export const getTaskLocation = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: TaskId, token: Token }).parse(i))
  .handler(async ({ data }) => call(`/task/${data.taskId}/location`, { token: data.token }));

export const recordLocation = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      taskId: TaskId,
      token: Token,
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { taskId, token, ...body } = data;
    return call(`/task/${taskId}/location`, { method: "POST", token, body });
  });

export const toggleTaskLocation = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      taskId: TaskId,
      token: Token,
      sharing: z.boolean().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { taskId, token, ...body } = data;
    return call(`/task/${taskId}/location/toggle`, {
      method: "POST",
      token,
      body: Object.keys(body).length ? body : undefined,
    });
  });

export const markArrived = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      taskId: TaskId,
      token: Token,
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { taskId, token, ...body } = data;
    return call(`/task/${taskId}/arrived`, {
      method: "POST",
      token,
      body: Object.keys(body).length ? body : undefined,
    });
  });

// ---- Payments (Flutterwave) --------------------------------------------
// The escrow checkout URL is created server-side when the poster accepts a
// tasker (PUT /task/{id}/accept/{tasker_id}). After paying, Flutterwave
// redirects to GET /task/payment/callback?tx_ref&transaction_id&status,
// which finalises the escrow on the backend.
export const paymentCallback = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      tx_ref: z.string().min(1).max(200),
      transaction_id: z.string().min(1).max(200),
      status: z.string().min(1).max(40),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const qs = new URLSearchParams({
      tx_ref: data.tx_ref,
      transaction_id: data.transaction_id,
      status: data.status,
    }).toString();
    return call(`/task/payment/callback?${qs}`);
  });

export const releaseEscrow = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: TaskId, token: Token }).parse(i))
  .handler(async ({ data }) =>
    call(`/task/${data.taskId}/release`, { method: "POST", token: data.token }),
  );

// Deprecated aliases — kept temporarily so older imports compile. They now
// rely on the accept response to surface a Flutterwave checkout URL.
export const initiateEscrow = acceptApplicant;
export const verifyPayment = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ reference: z.string().min(1).max(200), token: Token }).parse(i),
  )
  .handler(async ({ data }) => {
    // No standalone verify endpoint in the spec; payment is finalised by the
    // Flutterwave callback. Treat any call as "pending" so callers stop polling.
    return {
      ok: true as const,
      data: { reference: data.reference, status: "pending", verified: false },
    };
  });

// ============ ADMIN ENDPOINTS ============
export const adminFreezeUser = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ userId: UserId, token: Token }).parse(i))
  .handler(async ({ data }) => call(`/admin/user/${data.userId}/freeze`, { method: "POST", token: data.token }));

export const adminBanUser = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ userId: UserId, token: Token }).parse(i))
  .handler(async ({ data }) => call(`/admin/user/${data.userId}/ban`, { method: "POST", token: data.token }));

export const adminReactivateUser = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ userId: UserId, token: Token }).parse(i))
  .handler(async ({ data }) => call(`/admin/user/${data.userId}/reactivate`, { method: "POST", token: data.token }));

export const adminViewLedger = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ userId: UserId, token: Token }).parse(i))
  .handler(async ({ data }) => call(`/admin/user/${data.userId}/ledger`, { token: data.token }));

export const adminBlacklistBvn = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ bvn_hash: z.string().min(4).max(200), reason: z.string().min(3).max(500), token: Token }).parse(i))
  .handler(async ({ data }) => call(`/admin/blacklist/BVN`, { method: "POST", body: { bvn_hash: data.bvn_hash, reason: data.reason }, token: data.token }));

export const adminUnblacklistBvn = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ bvn_hash: z.string().min(4).max(200), token: Token }).parse(i))
  .handler(async ({ data }) => call(`/admin/blacklist/BVN`, { method: "DELETE", body: { bvn_hash: data.bvn_hash }, token: data.token }));

export const adminAuditLog = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ target_id: z.string().max(120).optional(), token: Token }).parse(i))
  .handler(async ({ data }) => {
    const qs = data.target_id ? `?target_id=${encodeURIComponent(data.target_id)}` : "";
    return call(`/admin/audit/log${qs}`, { token: data.token });
  });

export const adminListDisputes = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token, status: z.string().max(30).optional() }).parse(i))
  .handler(async ({ data }) => {
    const qs = data.status ? `?status=${encodeURIComponent(data.status)}` : "";
    return call(`/admin/disputes${qs}`, { token: data.token });
  });

