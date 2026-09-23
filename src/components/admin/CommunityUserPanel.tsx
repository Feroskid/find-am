import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Loader2, MessagesSquare, Search, ExternalLink, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getCommunityProfile, communityAdminIdentity, communityAdminLookup } from "@/lib/community.functions";
import { adminUserContext, adminSearchUsers } from "@/lib/findtask.functions";
import { avatarUrl } from "@/lib/community-avatars";
import { Badges } from "@/components/community/CommunityShell";

const when = (v: any) => (v ? new Date(v).toLocaleDateString() : "—");
const money = (v: any) => (v == null || v === "" ? "—" : `₦${Number(v).toLocaleString()}`);

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-1.5 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-ink text-right truncate">{value === undefined || value === null || value === "" ? "—" : String(value)}</span>
    </div>
  );
}

function pickId(o: any): string | null {
  if (!o) return null;
  const v =
    o.user_id ?? o.findam_user_id ?? o.find_am_user_id ?? o.account_id ?? o.id ?? o.user?.user_id ?? o.user?.id;
  return v == null || v === "" ? null : String(v);
}

function pickUsername(o: any): string | null {
  if (!o) return null;
  const v = o.username ?? o.community_username ?? o.member?.username ?? o.profile?.username;
  return v ? String(v) : null;
}

/**
 * Side-by-side view of a community member and the Find-am account behind it.
 * The link comes from the community service's admin identity/lookup endpoints,
 * with a name search only as a last resort.
 */
export function CommunityUserPanel({ token, seedUsername, seedUserId }: { token: string; seedUsername?: string; seedUserId?: string }) {
  const profileFn = useServerFn(getCommunityProfile);
  const identityFn = useServerFn(communityAdminIdentity);
  const lookupFn = useServerFn(communityAdminLookup);
  const ctxFn = useServerFn(adminUserContext);
  const searchFn = useServerFn(adminSearchUsers);

  const [mode, setMode] = useState<"username" | "userId">(seedUserId && !seedUsername ? "userId" : "username");
  const [input, setInput] = useState(seedUserId && !seedUsername ? seedUserId : (seedUsername ?? ""));
  const [community, setCommunity] = useState<any>(null);
  const [ctx, setCtx] = useState<any>(null);
  const [linkNote, setLinkNote] = useState<string | null>(null);

  const load = useMutation({
    mutationFn: async (raw: string) => {
      const value = raw.trim().replace(/^@/, "");
      let username: string | null = null;
      let userId: string | null = null;
      let note: string | null = null;
      let prof: any = null;

      if (mode === "userId") {
        // Find-am account id → community profile.
        const l: any = await lookupFn({ data: { token, userId: value } });
        if (!l.ok) {
          throw new Error(
            l.status === 404
              ? "That Find-am account has no community profile."
              : l.error,
          );
        }
        const body = l.data?.member ?? l.data?.profile ?? l.data;
        username = pickUsername(body);
        userId = value;
        if (!username) throw new Error("The community service returned no username for that account.");
      } else {
        username = value;
        // Community username → Find-am account id.
        const idr: any = await identityFn({ data: { token, username } });
        if (idr.ok) {
          const body = idr.data?.identity ?? idr.data?.user ?? idr.data;
          userId = pickId(body);
          if (!userId) note = "The community service found the member but returned no Find-am account id.";
        } else if (idr.status === 404) {
          note = "The community service has no account link for that username.";
        } else if (idr.status === 401 || idr.status === 403) {
          note = "This account isn't allowed to look up community identities.";
        } else {
          note = idr.error;
        }
      }

      const p: any = await profileFn({ data: { username: username!, token } });
      if (!p.ok) throw new Error(p.status === 404 ? "No community member with that username." : p.error);
      prof = p.data?.profile ?? p.data?.member ?? p.data;

      if (!userId) {
        const direct = pickId(prof);
        if (direct) {
          userId = direct;
          note = null;
        } else {
          const s: any = await searchFn({ data: { q: username!, token } });
          const rows: any[] = s.ok ? (s.data?.users ?? s.data?.results ?? (Array.isArray(s.data) ? s.data : [])) : [];
          if (rows.length === 1) {
            userId = pickId(rows[0]);
            note = "Matched by name only, because the community service didn't return the account link — confirm before acting.";
          } else {
            note = note ?? "Could not work out which Find-am account this member belongs to. Search the Find-am side by email or ID.";
          }
        }
      }

      let context: any = null;
      if (userId) {
        const c: any = await ctxFn({ data: { userId, token } });
        if (c.ok) context = c.data;
        else note = c.error;
      }
      return { prof, context, note };
    },
    onSuccess: (r) => {
      setCommunity(r.prof);
      setCtx(r.context);
      setLinkNote(r.note);
    },
    onError: (e: any) => {
      setCommunity(null);
      setCtx(null);
      setLinkNote(null);
      toast.error(e?.message ?? "Lookup failed");
    },
  });

  const u = ctx?.user ?? ctx?.profile ?? null;
  const posted: any[] = ctx?.posted_tasks ?? [];
  const working: any[] = ctx?.working_tasks ?? [];
  const frozen = u ? u.is_frozen || !!u.frozen_until : false;
  const accountStatus = u ? (frozen ? "frozen" : String(u.user_status ?? "active")) : null;

  const flags: string[] = [];
  if (community && u) {
    if (accountStatus && accountStatus !== "active" && !community.is_banned)
      flags.push(`Find-am account is ${accountStatus} but the community profile is still active.`);
    if (community.is_banned && accountStatus === "active")
      flags.push("Community access is suspended while the Find-am account is active.");
    if (!u.email_verified && u.email_verified !== undefined) flags.push("Find-am email is not verified.");
    if (u.kyc_verified === false) flags.push("Find-am identity check is not complete.");
    if (Array.isArray(community.roles) && community.roles.length > 0 && accountStatus !== "active")
      flags.push("This member holds community roles on a non-active Find-am account.");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="font-semibold text-ink inline-flex items-center gap-2">
        <MessagesSquare className="h-4 w-4 text-primary" /> Community ↔ Find-am
      </h3>

      <div className="flex gap-1">
        {(["username", "userId"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {m === "username" ? "By community username" : "By Find-am account ID"}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const v = input.trim().replace(/^@/, "");
          if (mode === "userId" ? v.length >= 1 : v.length >= 3) load.mutate(input);
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "userId" ? "Find-am account ID" : "community username"}
          className="flex-1 min-w-[160px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={load.isPending}
          className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold disabled:opacity-50"
        >
          {load.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} Compare
        </button>
      </form>

      {linkNote && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-[11px] text-amber-800 dark:text-amber-200 inline-flex items-start gap-1.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {linkNote}
        </p>
      )}

      {community && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-center gap-2">
              <img src={avatarUrl(community.avatar_key)} alt="" className="h-10 w-10 rounded-full object-cover bg-muted" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink truncate inline-flex items-center gap-1.5">
                  {community.username_display ?? community.username}
                  <Badges badges={[...(community.roles ?? []), ...(community.badges ?? [])]} showMember />
                </div>
                <div className="text-[11px] text-muted-foreground">@{community.username}</div>
              </div>
              <Link
                to="/community/u/$username"
                params={{ username: String(community.username) }}
                target="_blank"
                className="ml-auto inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-muted"
              >
                Open <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-2">
              <Row label="Rank" value={community.rank ?? "JJC"} />
              <Row label="Points" value={community.points ?? 0} />
              <Row label="Threads" value={community.thread_count ?? 0} />
              <Row label="Replies" value={community.post_count ?? 0} />
              <Row label="Roles" value={(community.roles ?? []).join(", ") || "member"} />
              <Row label="Suspended" value={community.is_banned ? "Yes" : "No"} />
              <Row label="Joined community" value={when(community.created_at)} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-3">
            {u ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink truncate">{u.name ?? `User ${u.user_id ?? ""}`}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{u.user_id ?? "—"}</div>
                  </div>
                  <Link
                    to="/u/$userId"
                    params={{ userId: String(u.user_id ?? "") }}
                    target="_blank"
                    className="ml-auto inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-muted"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="mt-2">
                  <Row label="Email" value={u.email} />
                  <Row label="Phone" value={u.phone} />
                  <Row label="Status" value={accountStatus} />
                  <Row label="Identity check" value={u.kyc_verified ? "Verified" : "Not verified"} />
                  <Row label="Tasks posted" value={posted.length} />
                  <Row label="Tasks working" value={working.length} />
                  <Row label="Wallet" value={money(ctx?.wallet?.balance)} />
                  <Row label="Joined Find-am" value={when(u.created_at)} />
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No Find-am account matched to this community member yet.</p>
            )}
          </div>
        </div>
      )}

      {flags.length > 0 && (
        <ul className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200 space-y-1">
          {flags.map((f, i) => (
            <li key={i}>• {f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
