/**
 * Per-task message obfuscation (encryption-at-rest only — NOT true E2EE).
 *
 * The AES-GCM key is derived deterministically from public task metadata
 * (task_id + participant ids) via PBKDF2. Anyone who can read the task
 * record can derive the same key, so treat this as defense-in-depth
 * against casual DB scraping — NOT as a confidentiality guarantee.
 *
 * Do NOT label this as "end-to-end encrypted" in the UI. For real E2EE,
 * replace `roomSecret()` with an out-of-band key exchange (e.g. ECDH).
 */

const enc = new TextEncoder();
const dec = new TextDecoder();
const MAGIC = "E2:";

async function importKey(roomSecret: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw",
    enc.encode(roomSecret),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("findtask-e2ee-v1"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function b64(buf: ArrayBuffer): string {
  let s = "";
  const a = new Uint8Array(buf);
  for (let i = 0; i < a.byteLength; i++) s += String.fromCharCode(a[i]);
  return btoa(s);
}
function ub64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Deterministic room secret — must match on both sides. */
export function roomSecret(taskId: string | number, participants: Array<string | number>): string {
  const ids = [...participants.filter(Boolean).map(String)].sort();
  return `findtask:room:${taskId}:${ids.join(",")}`;
}

export async function encryptText(plain: string, roomSecretStr: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) return plain;
  try {
    const key = await importKey(roomSecretStr);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain));
    const combined = new Uint8Array(iv.length + ct.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ct), iv.length);
    return MAGIC + b64(combined.buffer);
  } catch {
    return plain;
  }
}

export async function decryptText(payload: string, roomSecretStr: string): Promise<string> {
  if (!payload?.startsWith(MAGIC)) return payload ?? "";
  if (typeof window === "undefined" || !window.crypto?.subtle) return payload;
  try {
    const key = await importKey(roomSecretStr);
    const combined = ub64(payload.slice(MAGIC.length));
    const iv = combined.slice(0, 12);
    const ct = combined.slice(12);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return dec.decode(plain);
  } catch {
    return "🔒 (encrypted — could not decrypt)";
  }
}

export function isEncrypted(payload: string | undefined | null): boolean {
  return typeof payload === "string" && payload.startsWith(MAGIC);
}
