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

  // Roles can arrive as `roles`, `badges`, a single `role`, or booleans.
  const roleSet = new Set<string>();
  for (const v of [data?.roles, data?.badges, raw?.roles, raw?.badges]) {
    if (Array.isArray(v)) v.forEach((r) => typeof r === "string" && roleSet.add(r));
  }
  for (const v of [data?.role, data?.mod_level, data?.level, raw?.level]) {
    if (typeof v === "string" && v) roleSet.add(v);
  }
  if (data?.is_admin) roleSet.add("admin");
  if (data?.is_super_moderator) roleSet.add("super_moderator");
  if (data?.is_moderator) roleSet.add("moderator");

  const roles: string[] = [...roleSet];
  const badges: string[] = Array.isArray(data?.badges) ? data.badges : roles;

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
