import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { getCommunityMe } from "@/lib/community.functions";

export type AuthorCard = {
  username: string;
  username_display?: string | null;
  avatar_key?: string | null;
  rank?: string | null;
  badges?: string[] | null;
};

export const RANKS = ["JJC", "Contributor", "Regular", "Veteran", "Agba", "OG👑"];

/** Friendly message for the API failure codes the community can return. */
export function communityError(r: { status: number; error: string }) {
  if (r.status === 428) return "Pick a community username first.";
  if (r.status === 403 && /ban/i.test(r.error)) return "Your community access is suspended.";
  if (r.status === 413) return "That image is too large — 5MB is the limit.";
  if (r.status === 429) return "You've hit the daily image upload limit.";
  return r.error;
}

export function isBannedResult(r: { ok: boolean; status?: number; error?: string }) {
  return !r.ok && r.status === 403 && /ban/i.test(r.error ?? "");
}

export function needsUsernameResult(r: { ok: boolean; status?: number }) {
  return !r.ok && r.status === 428;
}

/** The signed-in member's community identity, or null when not signed in. */
export function useCommunityMe() {
  const { token, ready } = useAuth();
  const meFn = useServerFn(getCommunityMe);

  const q = useQuery({
    queryKey: ["community", "me", token],
    enabled: ready && !!token,
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: () => meFn({ data: { token: token! } }),
  });

  const raw: any = q.data?.ok ? q.data.data : null;
  // The API may nest the member under `member`/`profile` depending on the call.
  const data: any = raw?.member ?? raw?.profile ?? raw;
  const needsUsername = !!data?.needs_username || (q.data && !q.data.ok && q.data.status === 428) || false;

  const roles: string[] = normalizeRoles(data, raw);
  const badges: string[] = roles;

  return {
    ready,
    signedIn: !!token,
    loading: q.isLoading,
    token: token ?? null,
    me: needsUsername ? null : data,
    needsUsername,
    isBanned: !!data?.is_banned,
    roles,
    badges,
    canModerate:
      roles.includes("moderator") ||
      roles.includes("super_moderator") ||
      roles.includes("admin") ||
      badges.includes("moderator") ||
      badges.includes("super_moderator") ||
      badges.includes("admin"),
    isSuperMod:
      roles.includes("super_moderator") || roles.includes("admin") || badges.includes("admin"),
    refetch: q.refetch,
  };
}

/** Canonical role key for any spelling the service uses. */
export function canonicalRole(v: unknown): string | null {
  if (typeof v !== "string" || !v) return null;
  const k = v.toLowerCase().replace(/[\s-]+/g, "_");
  if (["super_moderator", "supermoderator", "super_mod", "supermod"].includes(k)) return "super_moderator";
  if (k === "mod" || k === "moderator") return "moderator";
  if (k === "admin" || k === "administrator") return "admin";
  if (k === "member" || k === "user") return "member";
  return null;
}

/**
 * Reads roles from every shape the service sends: plain strings,
 * `{role, category}` records, `badges` arrays, single fields and booleans.
 */
export function normalizeRoles(...sources: any[]): string[] {
  const out = new Set<string>();
  const take = (v: any) => {
    if (Array.isArray(v)) return v.forEach(take);
    if (v && typeof v === "object") return take(v.role ?? v.name ?? v.level);
    const c = canonicalRole(v);
    if (c && c !== "member") out.add(c);
  };
  for (const s of sources) {
    if (!s) continue;
    if (Array.isArray(s) || typeof s === "string") { take(s); continue; }
    take(s.roles); take(s.badges); take(s.role); take(s.mod_level); take(s.level);
    if (s.is_admin) out.add("admin");
    if (s.is_super_moderator) out.add("super_moderator");
    if (s.is_moderator) out.add("moderator");
  }
  const order = ["admin", "super_moderator", "moderator"];
  return [...out].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/** Readable label list, with category when a role is limited to one. */
export function roleLabels(roles: any): string {
  const names: Record<string, string> = { admin: "Admin", super_moderator: "Super moderator", moderator: "Moderator" };
  const list = Array.isArray(roles) ? roles : roles ? [roles] : [];
  const parts = list.map((r: any) => {
    const key = canonicalRole(typeof r === "object" && r ? r.role : r);
    if (!key || key === "member") return null;
    const cat = typeof r === "object" && r ? (r.category ?? r.category_slug) : null;
    return names[key] + (cat ? ` (${typeof cat === "object" ? cat.name ?? cat.slug : cat})` : "");
  }).filter(Boolean);
  return [...new Set(parts)].join(", ") || "Member";
}

export function relTime(iso?: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
