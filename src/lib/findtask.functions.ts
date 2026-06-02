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
const TaskId = z.string().min(1).max(64);

// --- Categories ----------------------------------------------------------
export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => call("/task/categories"),
);

// --- Browse tasks --------------------------------------------------------
const BrowseSchema = z.object({
  q: z.string().max(200).optional(),
  category: z.string().max(80).optional(),
  level: z.string().max(40).optional(),
  location: z.string().max(160).optional(),
  min_price: z.number().min(0).max(100_000_000).optional(),
  max_price: z.number().min(0).max(100_000_000).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "deadline"]).optional(),
  page: z.number().int().min(1).max(500).optional(),
  per_page: z.number().int().min(1).max(50).optional(),
});
export const listTasks = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => BrowseSchema.parse(i))
  .handler(async ({ data }) => {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && v !== null) params.set(k, String(v));
    });
    const qs = params.toString();
    return call(`/task${qs ? `?${qs}` : ""}`);
  });

// --- Get task ------------------------------------------------------------
export const getTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: TaskId }).parse(i))
  .handler(async ({ data }) => call(`/task/${encodeURIComponent(data.taskId)}`));

// --- Create task ---------------------------------------------------------
const CreateTaskSchema = z.object({
  title: z.string().min(4).max(140),
  description: z.string().min(10).max(4000),
  budget: z.number().positive().max(100_000_000),
  location: z.string().min(2).max(160),
  deadline: z.string().max(64).optional(),
  category: z.string().max(80).optional(),
  level: z.string().max(40).optional(),
  token: Token,
});
export const createTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => CreateTaskSchema.parse(i))
  .handler(async ({ data }) => {
    const { token, ...body } = data;
    return call("/task", { method: "POST", body, token });
  });

// --- My tasks / applications --------------------------------------------
export const myTasks = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) => call("/task/mine", { token: data.token }));

export const myApplications = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) => call("/task/applications/mine", { token: data.token }));

// --- Apply to a task -----------------------------------------------------
export const applyToTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      taskId: TaskId,
      cover: z.string().min(2).max(2000).optional(),
      bid: z.number().min(0).max(100_000_000).optional(),
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { taskId, token, ...body } = data;
    return call(`/task/${encodeURIComponent(taskId)}/apply`, { method: "POST", body, token });
  });

// --- List applications for a task (poster) -------------------------------
export const listTaskApplications = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: TaskId, token: Token }).parse(i))
  .handler(async ({ data }) =>
    call(`/task/${encodeURIComponent(data.taskId)}/applications`, { token: data.token }),
  );

// --- Accept an applicant (starts escrow) ---------------------------------
export const acceptApplicant = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      taskId: TaskId,
      applicantId: z.string().min(1).max(64),
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { taskId, applicantId, token } = data;
    return call(`/task/${encodeURIComponent(taskId)}/accept`, {
      method: "POST",
      body: { applicant_id: applicantId, tasker_id: applicantId },
      token,
    });
  });

// --- Complete a task -----------------------------------------------------
export const completeTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: TaskId, token: Token }).parse(i))
  .handler(async ({ data }) =>
    call(`/task/${encodeURIComponent(data.taskId)}/complete`, { method: "POST", token: data.token }),
  );

// --- Dispute --------------------------------------------------------------
export const disputeTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      taskId: TaskId,
      reason: z.string().min(5).max(2000),
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { taskId, token, reason } = data;
    return call(`/task/${encodeURIComponent(taskId)}/dispute`, {
      method: "POST",
      body: { reason },
      token,
    });
  });

// --- Rate -----------------------------------------------------------------
export const rateTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      taskId: TaskId,
      rating: z.number().min(1).max(5),
      review: z.string().max(2000).optional(),
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { taskId, token, ...body } = data;
    return call(`/task/${encodeURIComponent(taskId)}/rate`, { method: "POST", body, token });
  });

// --- Tasker profile data --------------------------------------------------
export const getTaskerRatings = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskerId: z.string().min(1).max(64) }).parse(i))
  .handler(async ({ data }) => call(`/tasker/${encodeURIComponent(data.taskerId)}/ratings`));

export const getTaskerBadges = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskerId: z.string().min(1).max(64) }).parse(i))
  .handler(async ({ data }) => call(`/tasker/${encodeURIComponent(data.taskerId)}/badges`));

// --- Messages -------------------------------------------------------------
export const listMessages = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ taskId: TaskId, token: Token }).parse(i))
  .handler(async ({ data }) =>
    call(`/task/${encodeURIComponent(data.taskId)}/messages`, { token: data.token }),
  );

export const sendMessage = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({
      taskId: TaskId,
      body: z.string().min(1).max(4000),
      token: Token,
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { taskId, token, body } = data;
    return call(`/task/${encodeURIComponent(taskId)}/message`, {
      method: "POST",
      body: { body, message: body, text: body },
      token,
    });
  });

// --- Notifications --------------------------------------------------------
export const listNotifications = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: Token }).parse(i))
  .handler(async ({ data }) => call(`/notifications`, { token: data.token }));

export const markNotificationRead = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().min(1).max(64), token: Token }).parse(i),
  )
  .handler(async ({ data }) =>
    call(`/notifications/${encodeURIComponent(data.id)}/read`, {
      method: "POST",
      token: data.token,
    }),
  );
