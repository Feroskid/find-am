import { supabaseAdmin } from "@/integrations/supabase/client.server";

const API_BASE = "https://api.find-am.com";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Verify a Find-am API token and return the authenticated user payload. */
export async function verifyAppUser(token: string): Promise<any> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Not authorised");
  return await res.json().catch(() => ({}));
}

export function safeExt(filename: string, contentType: string): string {
  const fromName = (filename.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName && fromName.length <= 5) return fromName;
  if (contentType.startsWith("video/")) return "mp4";
  return "jpg";
}

/** Upload a chat attachment to private storage and return a long-lived signed URL. */
export async function uploadChatMedia(opts: {
  bytes: Uint8Array;
  contentType: string;
  filename: string;
  taskId: string | number;
  userId: string | number;
}): Promise<string> {
  const ext = safeExt(opts.filename, opts.contentType);
  const path = `task-${opts.taskId}/${opts.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const up = await supabaseAdmin.storage.from("task-media").upload(path, opts.bytes, {
    contentType: opts.contentType,
    upsert: false,
  });
  if (up.error) throw up.error;
  const signed = await supabaseAdmin.storage.from("task-media").createSignedUrl(path, TEN_YEARS);
  if (signed.error || !signed.data?.signedUrl) throw signed.error ?? new Error("Could not build media URL");
  return signed.data.signedUrl;
}

export function decodeBase64(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.slice(b64.indexOf(",") + 1) : b64;
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
