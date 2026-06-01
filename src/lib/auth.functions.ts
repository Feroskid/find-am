import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const API_BASE = "https://api.find-am.com";

const RegisterSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  phone: z.string().min(6).max(32),
  password: z.string().min(6).max(128),
  account_type: z.enum(["individual", "business"]).default("individual"),
});

const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

type AuthResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: number; error: string };

async function forward(path: string, body: unknown): Promise<AuthResult> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
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
      const errMsg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => d?.msg || JSON.stringify(d)).join(", ")
            : JSON.stringify(detail);
      return { ok: false, status: res.status, error: errMsg };
    }
    return { ok: true, data: parsed ?? {} };
  } catch (e: any) {
    return { ok: false, status: 0, error: e?.message || "Network error" };
  }
}

export const registerUser = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RegisterSchema.parse(input))
  .handler(async ({ data }) => forward("/auth/register", data));

export const loginUser = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LoginSchema.parse(input))
  .handler(async ({ data }) => forward("/auth/login", data));
