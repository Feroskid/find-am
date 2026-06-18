// Helpers to encode/decode structured offer + counter + reply metadata
// inside the free-form `message` body (backend has no dedicated columns).

export type OfferKind = "OFFER" | "COUNTER" | "REPLY" | "DECLINE";

const AMOUNT_RE = /\[(OFFER|COUNTER)\s+₦([\d,]+)(?:\s+to\s+([^\]]+))?\]/i;
const REPLY_RE = /\[REPLY-TO\s+offer:([^\]]+)\]/i;
const DECLINE_RE = /\[DECLINE(?:\s+to\s+([^\]]+))?\]/i;

export function parseOfferAmount(message?: string | null): number | null {
  if (!message) return null;
  const m = message.match(AMOUNT_RE);
  if (!m) return null;
  const n = Number(m[2].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function parseCounterTarget(message?: string | null): string | null {
  if (!message) return null;
  const m = message.match(AMOUNT_RE);
  return m?.[3]?.trim() ?? null;
}

export function parseReplyTarget(message?: string | null): string | null {
  if (!message) return null;
  const m = message.match(REPLY_RE);
  return m?.[1]?.trim() ?? null;
}

export function isDecline(message?: string | null): boolean {
  if (!message) return false;
  return DECLINE_RE.test(message);
}

export function stripHeaders(message?: string | null): string {
  if (!message) return "";
  return message
    .replace(AMOUNT_RE, "")
    .replace(REPLY_RE, "")
    .replace(DECLINE_RE, "")
    .replace(/^\s*\n+/, "")
    .trim();
}

export function formatOfferMessage(opts: {
  amount?: number;
  body: string;
  startDate?: string;
  kind?: OfferKind;
  toName?: string;
  replyTo?: string;
}): string {
  const lines: string[] = [];
  const kind = opts.kind ?? "OFFER";
  if (opts.amount && (kind === "OFFER" || kind === "COUNTER")) {
    const amt = `₦${opts.amount.toLocaleString()}`;
    lines.push(opts.toName ? `[${kind} ${amt} to ${opts.toName}]` : `[${kind} ${amt}]`);
  }
  if (kind === "DECLINE") lines.push(opts.toName ? `[DECLINE to ${opts.toName}]` : `[DECLINE]`);
  if (kind === "REPLY" && opts.replyTo) lines.push(`[REPLY-TO offer:${opts.replyTo}]`);
  if (opts.body?.trim()) lines.push("", opts.body.trim());
  if (opts.startDate) lines.push("", `Earliest start: ${opts.startDate}`);
  return lines.join("\n");
}
