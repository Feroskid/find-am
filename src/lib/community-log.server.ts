import { supabaseAdmin } from "@/integrations/supabase/client.server";

const API_BASE = "https://api.find-am.com";

export type CommunityActor = {
  username: string;
  display: string | null;
  roles: string[];
  level: string | null;
};

/** Resolve the community member behind a Find-am token. Throws when invalid. */
export async function requireCommunityActor(token: string): Promise<CommunityActor> {
  const res = await fetch(`${API_BASE}/community/me`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Your session has expired. Please sign in again.");
  const raw = await res.json().catch(() => ({}));
  const m = raw?.member ?? raw?.profile ?? raw ?? {};

  const set = new Set<string>();
  for (const v of [m.roles, m.badges, raw?.roles, raw?.badges]) {
    if (Array.isArray(v)) v.forEach((r: any) => typeof r === "string" && set.add(r));
  }
  for (const v of [m.role, m.mod_level, m.level, raw?.level]) {
    if (typeof v === "string" && v) set.add(v);
  }
  if (m.is_admin) set.add("admin");
  if (m.is_super_moderator) set.add("super_moderator");
  if (m.is_moderator) set.add("moderator");

  const roles = [...set];
  const level = roles.includes("admin")
    ? "admin"
    : roles.includes("super_moderator")
      ? "super_moderator"
      : roles.includes("moderator")
        ? "moderator"
        : "member";

  const username = m.username ?? m.username_display ?? null;
  if (!username) throw new Error("This account has no community profile yet.");
  return { username: String(username), display: m.username_display ?? null, roles, level };
}

export async function insertCommunityAction(input: {
  actor: CommunityActor;
  action: string;
  target_type: string;
  target_id?: string | null;
  target_username?: string | null;
  reason?: string | null;
}) {
  const { error } = await supabaseAdmin.from("community_mod_actions").insert({
    actor_username: input.actor.username,
    actor_display: input.actor.display,
    actor_level: input.actor.level,
    actor_roles: input.actor.roles,
    action: input.action,
    target_type: input.target_type,
    target_id: input.target_id ?? null,
    target_username: input.target_username ?? null,
    reason: input.reason ?? null,
  });
  if (error) throw error;
}

export async function selectCommunityActions(opts: { actor?: string | undefined; limit?: number | undefined }) {
  let q = supabaseAdmin
    .from("community_mod_actions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.min(opts.limit ?? 200, 500));
  if (opts.actor) q = q.ilike("actor_username", opts.actor);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
