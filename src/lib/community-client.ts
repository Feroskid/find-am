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

export type CommunityRoleAssignment = {
  assignmentId?: string;
  userId?: string;
  username: string;
  displayName: string;
  avatarKey?: string;
  rank?: string;
  points?: number;
  role: "moderator" | "super_moderator" | "admin";
  categorySlug?: string;
  grantedAt?: string;
  raw: any;
};

/** Unwrap the member record returned by profile, identity, lookup, or role-list calls. */
export function unwrapCommunityMember(source: any): any {
  if (!source || typeof source !== "object") return source;
  return (
    source.community_profile ??
    source.community_member ??
    source.member ??
    source.profile ??
    source.community ??
    source.user ??
    source.identity ??
    source.data ??
    source
  );
}

function scalar(source: any, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

export function communityUserId(source: any): string | null {
  if (typeof source === "string" || typeof source === "number") return String(source);
  if (!source || typeof source !== "object") return null;
  const direct = scalar(source, ["user_id", "userId", "findam_user_id", "find_am_user_id", "findtask_user_id", "account_id", "auth_user_id"]);
  if (direct) return direct;
  const knownNestedId = source.identity?.id ?? source.account?.id ?? source.user?.id;
  if (typeof knownNestedId === "string" || typeof knownNestedId === "number") return String(knownNestedId);
  for (const child of [source.identity, source.account, source.user, source.member, source.profile, source.community]) {
    const nested = communityUserId(child);
    if (nested) return nested;
  }
  return null;
}

export function communityUsername(source: any): string | null {
  if (!source || typeof source !== "object") return null;
  const direct = scalar(source, ["username", "community_username"]);
  if (direct) return direct;
  for (const child of [source.community_profile, source.community_member, source.member, source.profile, source.community, source.user]) {
    const nested = communityUsername(child);
    if (nested) return nested;
  }
  return null;
}

function categorySlug(value: any): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") return undefined;
  return scalar(value, ["slug", "category_slug", "name"]);
}

/** Normalize one row per assigned role while preserving identifiers needed for revocation. */
export function normalizeRoleAssignments(source: any): CommunityRoleAssignment[] {
  const payload = source?.data ?? source;
  const rows: any[] = payload?.roles ?? payload?.assignments ?? payload?.members ?? payload?.items ?? (Array.isArray(payload) ? payload : []);
  const out: CommunityRoleAssignment[] = [];
  for (const row of rows) {
    const person = unwrapCommunityMember(row?.member ?? row?.profile ?? row?.user ?? row);
    const rowRoles = Array.isArray(row?.roles) ? row.roles : [row];
    for (const roleRow of rowRoles) {
      const role = canonicalRole(roleRow?.role ?? roleRow?.level ?? roleRow);
      if (role !== "moderator" && role !== "super_moderator" && role !== "admin") continue;
      const username = communityUsername(person) ?? communityUsername(row) ?? "";
      const displayName = scalar(person, ["username_display", "display_name", "name", "full_name"]) ?? scalar(row, ["username_display", "display_name", "name", "full_name"]) ?? username;
      out.push({
        assignmentId: scalar(roleRow, ["assignment_id", "role_id"]) ?? scalar(row, ["assignment_id", "role_id"]),
        userId: communityUserId(row) ?? communityUserId(person) ?? undefined,
        username,
        displayName,
        avatarKey: scalar(person, ["avatar_key"]) ?? scalar(row, ["avatar_key"]),
        rank: scalar(person, ["rank"]) ?? scalar(row, ["rank"]),
        points: Number(person?.points ?? row?.points ?? 0),
        role,
        categorySlug: categorySlug(roleRow?.category_slug ?? roleRow?.category ?? row?.category_slug ?? row?.category),
        grantedAt: scalar(roleRow, ["granted_at", "created_at"]) ?? scalar(row, ["granted_at", "created_at"]),
        raw: row,
      });
    }
  }
  return out;
}

/** Category limits assigned to a moderator. An empty list means unscoped. */
export function moderatorCategoryScopes(...sources: any[]): string[] {
  const scopes = new Set<string>();
  const walk = (value: any) => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== "object") return;
    if (canonicalRole(value.role ?? value.level) === "moderator") {
      const slug = categorySlug(value.category_slug ?? value.category);
      if (slug) scopes.add(slug.toLowerCase());
    }
    walk(value.roles);
  };
  sources.forEach(walk);
  return [...scopes];
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
