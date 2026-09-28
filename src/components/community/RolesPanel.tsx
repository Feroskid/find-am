import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, Loader2, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { avatarUrl } from "@/lib/community-avatars";
import { communityError, normalizeRoleAssignments, relTime, type CommunityRoleAssignment } from "@/lib/community-client";
import { listCommunityRoles, grantCommunityRole, revokeCommunityRole } from "@/lib/community.functions";
import { logCommunityAction } from "@/lib/community-log.functions";

import { Badges, RankBadge } from "@/components/community/CommunityShell";

type Role = "moderator" | "super_moderator";

/** Super mods and admins grant or remove moderator access here. */
export function RolesPanel({ token, viewerLevel = "super_moderator" }: { token: string; viewerLevel?: "super_moderator" | "admin" }) {
  const listFn = useServerFn(listCommunityRoles);
  const grantFn = useServerFn(grantCommunityRole);
  const revokeFn = useServerFn(revokeCommunityRole);
  const logFn = useServerFn(logCommunityAction);

  const [username, setUsername] = useState("");
  const [role, setRole] = useState<Role>("moderator");
  const [category, setCategory] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["community", "roles", token],
    retry: false,
    queryFn: () => listFn({ data: { token } }),
  });

  const grant = useMutation({
    mutationFn: () =>
      grantFn({
        data: {
          token,
          username: username.trim().replace(/^@/, ""),
          role,
          category_slug: role === "moderator" && category.trim() ? category.trim() : undefined,
        },
      }),
    onSuccess: (r: any) => {
      if (!r.ok) return toast.error(communityError(r));
      toast.success("Role granted");
      void logFn({
        data: {
          token,
          action: `grant_${role}`,
          target_type: "role",
          target_username: username.trim().replace(/^@/, ""),
          reason: category.trim() || undefined,
        },
      });
      setUsername("");
      setCategory("");
      q.refetch();
    },
  });

  const revoke = useMutation({
    mutationFn: (v: { username: string; role: Role; category_slug?: string }) => {
      if (!v.username) throw new Error("This role assignment has no username, so it cannot be removed safely.");
      return revokeFn({ data: { token, ...v } });
    },
    onSuccess: (r: any, v) => {
      if (!r.ok) return toast.error(communityError(r));
      toast.success("Role removed");
      void logFn({
        data: { token, action: `revoke_${v.role}`, target_type: "role", target_username: v.username },
      });
      setConfirming(null);
      q.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Role removal failed"),
  });


  const payload: any = q.data?.ok ? q.data.data : null;
  const assignments = normalizeRoleAssignments(payload).filter((assignment) => assignment.role !== "admin");
  const people = [...assignments.reduce((map, assignment) => {
    const key = assignment.username.toLowerCase() || assignment.userId || `unknown:${assignment.assignmentId ?? map.size}`;
    const current = map.get(key);
    if (current) current.assignments.push(assignment);
    else map.set(key, { member: assignment, assignments: [assignment] });
    return map;
  }, new Map<string, { member: CommunityRoleAssignment; assignments: CommunityRoleAssignment[] }>()).values()];
  const denied = q.data && !q.data.ok && (q.data.status === 401 || q.data.status === 403);

  if (denied) return null;

  const canSubmit = username.trim().replace(/^@/, "").length >= 3 && !grant.isPending;

  return (
    <div className="rounded-xl bg-white border border-black/10 p-4 mb-4">
      <div className="text-xs font-bold uppercase tracking-wider text-black/50 mb-2 inline-flex items-center gap-1">
        <ShieldCheck className="h-3.5 w-3.5" /> Moderator access
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) grant.mutate();
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          className="flex-1 min-w-[140px] rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#E5A54B]"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#E5A54B]"
        >
          <option value="moderator">Moderator</option>
          {viewerLevel === "admin" && <option value="super_moderator">Super moderator</option>}
        </select>
        {role === "moderator" && (
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="category (optional)"
            className="w-[150px] rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[#E5A54B]"
          />
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-[#1a1a1a] text-white px-4 py-2 text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-50"
        >
          {grant.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />} Grant
        </button>
      </form>
      <p className="mt-1.5 text-[11px] text-black/50">
        Leave the category blank to let a moderator work across the whole community.
      </p>

      <div className="mt-3 border-t border-black/10 pt-3">
        {q.isFetching && !q.data ? (
          <p className="text-xs text-black/50">Loading current team…</p>
        ) : q.data && !q.data.ok ? (
          <p className="text-xs text-red-600">{communityError(q.data as any)}</p>
        ) : people.length === 0 ? (
          <p className="text-xs text-black/50">Nobody holds moderator access yet.</p>
        ) : (
          <ul className="space-y-2">
            {people.map(({ member, assignments }, i) => {
              const uname = member.username;
              const personKey = uname || member.userId || String(i);
              return (
                <li key={personKey} className="flex flex-wrap items-start gap-2 text-sm">
                  <img src={avatarUrl(member.avatarKey)} alt="" className="h-8 w-8 rounded-full object-cover bg-black/5" />
                  <div className="min-w-0">
                    <div className="font-semibold inline-flex items-center gap-2 flex-wrap">
                      {member.displayName || (uname ? `@${uname}` : member.userId ? `User ${member.userId}` : "Unknown member")}
                      <RankBadge rank={member.rank} points={member.points} />
                      <Badges badges={assignments.map((a) => a.role)} />
                    </div>
                    <div className="text-xs text-black/50">
                      {uname ? `@${uname}` : member.userId ?? "Profile details unavailable"}
                    </div>
                  </div>
                  <div className="ml-auto flex flex-col items-end gap-1.5">
                    {uname && (
                      <Link
                        to="/community/u/$username"
                        params={{ username: uname }}
                        className="text-xs font-semibold rounded bg-black/5 px-3 py-1.5 hover:bg-black/10"
                      >
                        Open profile
                      </Link>
                    )}
                    {assignments.map((assignment, assignmentIndex) => {
                      const key = `${personKey}:${assignment.role}:${assignment.categorySlug ?? ""}:${assignmentIndex}`;
                      if (assignment.role === "super_moderator" && viewerLevel !== "admin") return null;
                      return confirming === key ? (
                        <div key={key} className="flex gap-1">
                          <button type="button" onClick={() => revoke.mutate({ username: uname, role: assignment.role as Role, category_slug: assignment.categorySlug })} className="text-xs font-semibold rounded bg-red-600 text-white px-3 py-1.5">Confirm remove</button>
                          <button type="button" onClick={() => setConfirming(null)} className="text-xs rounded bg-black/5 px-3 py-1.5">Cancel</button>
                        </div>
                      ) : (
                        <button key={key} type="button" disabled={!uname} onClick={() => setConfirming(key)} className="text-xs font-semibold rounded bg-red-100 text-red-700 px-3 py-1.5 hover:bg-red-200 inline-flex items-center gap-1 disabled:opacity-50">
                          <Trash2 className="h-3 w-3" /> Remove {assignment.role === "super_moderator" ? "Super mod" : "Mod"}{assignment.categorySlug ? ` · ${assignment.categorySlug}` : ""}
                        </button>
                      );
                    })}
                  </div>
                  <div className="basis-full pl-10 text-[11px] text-black/50">
                    {assignments.map((a) => `${a.role === "super_moderator" ? "Super moderator" : "Moderator"}${a.categorySlug ? ` · ${a.categorySlug}` : " · all categories"}${a.grantedAt ? ` · since ${relTime(a.grantedAt)}` : ""}`).join(" | ")}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
