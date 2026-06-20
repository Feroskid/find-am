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
// API task IDs are integers; accept numeric strings too.
const TaskId = z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]);
const TaskerId = z.union([z.number().int().positive(), z.string().min(1).max(64)]);

// --- Categories ----------------------------------------------------------
export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => call("/task/categories"),
);

export const getSubCategories = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ parentId: z.number().int().positive() }).parse(i))
  .handler(async ({ data }) => call(`/task/categories?parent=${data.parentId}`));

// --- Auth helpers --------------------------------------------------------
export const verifyEmail = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: z.string().min(1).max(4096) }).parse(i))
  .handler(async ({ data }) =>
    call(`/auth/verify-email`, { method: "POST", body: { token: data.token } }),
  );

export const resendVerification = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      email: z.string().email().max(200).optional(),
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) =>
    call(`/auth/resend-verification`, {
      method: "POST",
      token: data.token,
    }),
  );

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

// --- Browse / search tasks ----------------------------------------------
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

// --- Get task ------------------------------------------------------------
export const getTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: TaskId }).parse(i))
  .handler(async ({ data }) => call(`/task/${data.taskId}`));

// --- Create task ---------------------------------------------------------
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
    const { token, latitude, longitude, milestones, ...rest } = data;
    const body: Record<string, unknown> = { ...rest };
    if (latitude !== undefined) {
      body.latitude = latitude;
      body.location_lat = latitude;
    }
    if (longitude !== undefined) {
      body.longitude = longitude;
      body.location_lng = longitude;
    }
    if (milestones && milestones.length > 0) {
      body.milestones = milestones;
      body.has_milestones = 1;
      body.quantity = 1; // milestone tasks are single-tasker only
    }
    return call("/task/post", { method: "POST", body, token });
  });

// --- Apply to a task -----------------------------------------------------
export const applyToTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      taskId: TaskId,
      message_text: z.string().min(2).max(2000).optional(),
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) =>
    call(`/task/${data.taskId}/apply`, {
      method: "POST",
      body: { message_text: data.message_text ?? "" },
      token: data.token,
    }),
  );



// --- List applications for a task (poster) -------------------------------
export const listTaskApplications = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: TaskId, token: Token }).parse(i))
  .handler(async ({ data }) =>
    call(`/task/${data.taskId}/applications`, { token: data.token }),
  );

// --- Accept a tasker (PUT /task/{id}/accept/{tasker_id}) -----------------
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

// --- Complete ------------------------------------------------------------
export const completeTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: TaskId, token: Token }).parse(i))
  .handler(async ({ data }) =>
    call(`/task/${data.taskId}/complete`, { method: "POST", token: data.token }),
  );

// --- Dispute -------------------------------------------------------------
export const disputeTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      taskId: TaskId,
      reason: z.string().min(5).max(2000),
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) =>
    call(`/task/${data.taskId}/dispute`, {
      method: "POST",
      body: { reason: data.reason },
      token: data.token,
    }),
  );

// --- Rate ----------------------------------------------------------------
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

// --- Messages ------------------------------------------------------------
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
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) =>
    call(`/task/${data.taskId}/message`, {
      method: "POST",
      body: { message_text: data.message_text },
      token: data.token,
    }),
  );

// --- Notifications -------------------------------------------------------
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

// --- Wallet --------------------------------------------------------------
export const walletBalance = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) => call(`/wallet/balance`, { token: data.token }));

export const walletTransactions = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) => call(`/wallet/transactions`, { token: data.token }));

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

// --- Profile (self) ------------------------------------------------------
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

// --- Public user --------------------------------------------------------
const UserId = z.union([z.number().int().positive(), z.string().min(1).max(64)]);
export const getPublicUser = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ userId: UserId }).parse(i))
  .handler(async ({ data }) => call(`/user/${data.userId}`));

export const getUserRatings = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ userId: UserId }).parse(i))
  .handler(async ({ data }) => call(`/user/${data.userId}/ratings`));

export const getUserTasks = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ userId: UserId, token: Token.optional() }).parse(i))
  .handler(async ({ data }) => call(`/user/${data.userId}/tasks`, { token: data.token }));

// --- Payments (Paystack) ------------------------------------------------
export const initiateEscrow = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: TaskId, token: Token }).parse(i))
  .handler(async ({ data }) =>
    call(`/payments/escrow/${data.taskId}`, { method: "POST", token: data.token }),
  );

export const verifyPayment = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ reference: z.string().min(4).max(200), token: Token }).parse(i),
  )
  .handler(async ({ data }) =>
    call(`/payments/verify/${data.reference}`, { token: data.token }),
  );

export const releaseEscrow = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: TaskId, token: Token }).parse(i))
  .handler(async ({ data }) =>
    call(`/task/${data.taskId}/release`, { method: "POST", token: data.token }),
  );
