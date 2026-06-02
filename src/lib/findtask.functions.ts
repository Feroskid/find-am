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

// --- Categories ----------------------------------------------------------
export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => call("/task/categories"),
);

// --- Browse tasks --------------------------------------------------------
const BrowseSchema = z.object({
  q: z.string().max(200).optional(),
  category: z.string().max(80).optional(),
  page: z.number().int().min(1).max(500).optional(),
});
export const listTasks = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => BrowseSchema.parse(i))
  .handler(async ({ data }) => {
    const params = new URLSearchParams();
    if (data.q) params.set("q", data.q);
    if (data.category) params.set("category", data.category);
    if (data.page) params.set("page", String(data.page));
    const qs = params.toString();
    return call(`/task${qs ? `?${qs}` : ""}`);
  });

// --- Get task ------------------------------------------------------------
export const getTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ taskId: z.string().min(1).max(64) }).parse(i),
  )
  .handler(async ({ data }) => call(`/task/${encodeURIComponent(data.taskId)}`));

// --- Create task ---------------------------------------------------------
const CreateTaskSchema = z.object({
  title: z.string().min(4).max(140),
  description: z.string().min(10).max(4000),
  budget: z.number().positive().max(100_000_000),
  location: z.string().min(2).max(160),
  deadline: z.string().max(64).optional(),
  category: z.string().max(80).optional(),
  token: z.string().min(8).max(4096),
});
export const createTask = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => CreateTaskSchema.parse(i))
  .handler(async ({ data }) => {
    const { token, ...body } = data;
    return call("/task", { method: "POST", body, token });
  });

// --- My tasks (poster) ---------------------------------------------------
export const myTasks = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ token: z.string().min(8).max(4096) }).parse(i),
  )
  .handler(async ({ data }) => call("/task/mine", { token: data.token }));

// --- My applications (tasker) -------------------------------------------
export const myApplications = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ token: z.string().min(8).max(4096) }).parse(i),
  )
  .handler(async ({ data }) => call("/task/applications/mine", { token: data.token }));
