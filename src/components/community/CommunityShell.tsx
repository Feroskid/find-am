import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { Bell, LogIn, Plus, Shield, Search, ArrowLeft, Home } from "lucide-react";
import { avatarUrl } from "@/lib/community-avatars";
import { useCommunityMe, type AuthorCard } from "@/lib/community-client";
import { listNotifications } from "@/lib/community.functions";
import { ThemeToggle } from "@/components/ThemeToggle";

function SocialLinks() {
  return (
    <div className="flex items-center justify-center gap-4 text-black/50">
      <a href="https://x.com/Find_am_1" target="_blank" rel="noreferrer" aria-label="Find-am on X" className="hover:text-black">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.9 2H22l-7.1 8.1L22.6 22h-6.3l-4.6-6.1L6.2 22H3l7.4-8.4L2.6 2H9l4.3 5.7L18.9 2Zm-1.1 18h1.7L7.4 3.7H5.6L17.8 20Z" /></svg>
      </a>
      <a href="https://www.instagram.com/find_am_1" target="_blank" rel="noreferrer" aria-label="Find-am on Instagram" className="hover:text-black">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.5.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .5 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.5 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.5-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.5-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.5-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.5C8.4 2.2 8.8 2.2 12 2.2Zm0 5.1a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-8a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z" /></svg>
      </a>
      <a href="https://www.youtube.com/@Find_Am_Tasks" target="_blank" rel="noreferrer" aria-label="Find-am on YouTube" className="hover:text-black">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M21.6 7.2s-.2-1.4-.8-2c-.8-.8-1.7-.8-2.1-.9C16.8 4.1 12 4.1 12 4.1h-.1s-4.8 0-6.7.2c-.4.1-1.3.1-2.1.9-.6.6-.8 2-.8 2S2 8.8 2 10.5v1.6c0 1.6.2 3.3.2 3.3s.2 1.4.8 2c.8.8 1.8.8 2.2.9 1.6.1 6.8.2 6.8.2s4.8 0 6.7-.2c.4-.1 1.3-.1 2.1-.9.6-.6.8-2 .8-2s.2-1.6.2-3.3v-1.6c0-1.7-.2-3.3-.2-3.3ZM9.9 14.6V8.9l6.2 2.9-6.2 2.8Z" /></svg>
      </a>
      <a href="https://www.tiktok.com/@find_am" target="_blank" rel="noreferrer" aria-label="Find-am on TikTok" className="hover:text-black">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M16.6 2h-3v13.1a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.5a5.7 5.7 0 1 0 4.8 5.6V8.8c1 .8 2.3 1.3 3.7 1.3V7c-1.9 0-3.5-1.5-3.7-3.4V2Z" /></svg>
      </a>
    </div>
  );
}

export function CommunityShell({ children }: { children: ReactNode }) {
  const c = useCommunityMe();
  const notifFn = useServerFn(listNotifications);
  const notifQ = useQuery({
    queryKey: ["community", "notif-count", c.token],
    enabled: !!c.token && !c.needsUsername,
    refetchInterval: 60_000,
    queryFn: () => notifFn({ data: { token: c.token!, perPage: 1 } }),
  });
  const unread: number = notifQ.data?.ok ? ((notifQ.data.data as any).unread ?? 0) : 0;

  return (
    <div className="community-scope min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-black/5">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-2 sm:gap-3">
          <Link to="/community" className="flex items-center gap-2 shrink-0">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#E5A54B] text-white font-bold">FA</div>
            <span className="font-bold text-lg tracking-tight hidden sm:inline">Find-am <span className="text-[#E5A54B]">Community</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm ml-3">
            <Link to="/community" className="px-3 py-1.5 rounded-lg hover:bg-black/5 font-medium">Home</Link>
            <Link to="/community/search" search={{ q: "" } as any} className="px-3 py-1.5 rounded-lg hover:bg-black/5 font-medium">Search</Link>
            {c.signedIn && !c.needsUsername && c.canModerate && (
              <Link to="/community/moderation" className="px-3 py-1.5 rounded-lg hover:bg-black/5 font-medium inline-flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" /> Moderation
              </Link>
            )}
            <Link to="/" className="px-3 py-1.5 rounded-lg hover:bg-black/5 font-medium text-black/60">← Back to Find-am</Link>
          </nav>
          <div className="flex-1" />
          {/* Mobile: the nav above is hidden, so keep a way back to Find-am. */}
          <Link
            to="/"
            className="md:hidden inline-flex items-center gap-1 rounded-lg border border-black/10 px-2 py-1.5 text-xs font-semibold text-black/70 hover:bg-black/5"
            aria-label="Back to Find-am"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Find-am
          </Link>
          <Link to="/community/search" search={{ q: "" } as any} className="md:hidden p-2 rounded-lg hover:bg-black/5" aria-label="Search">
            <Search className="h-4 w-4" />
          </Link>
          <ThemeToggle />
          {c.signedIn ? (
            <>
              <Link to="/community/notifications" className="relative p-2 rounded-lg hover:bg-black/5" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-[#E5A54B] text-white text-[10px] font-bold">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link to="/community/new" className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-[#1a1a1a] text-white px-3 py-1.5 text-sm font-semibold hover:opacity-90">
                <Plus className="h-4 w-4" /> New thread
              </Link>
              {c.needsUsername ? (
                <Link to="/community/username" className="text-sm font-semibold text-[#E5A54B] hover:underline">Pick a username</Link>
              ) : (
                <Link to="/community/u/$username" params={{ username: c.me?.username ?? "" }} className="flex items-center gap-2 text-sm">
                  <img src={avatarUrl(c.me?.avatar_key)} alt="" className="h-8 w-8 rounded-full object-cover bg-black/5" />
                  <span className="hidden sm:flex flex-col items-end leading-tight">
                    <span className="font-semibold">{c.me?.username_display ?? c.me?.username ?? "You"}</span>
                    <span className="text-[10px] text-[#E5A54B] font-bold uppercase">{c.me?.rank ?? "JJC"} · {c.me?.points ?? 0}pts</span>
                  </span>
                </Link>
              )}
            </>
          ) : (
            <Link to="/login" className="inline-flex items-center gap-1 rounded-lg bg-[#E5A54B] text-white px-4 py-1.5 text-sm font-bold hover:opacity-90">
              <LogIn className="h-4 w-4" /> Sign in
            </Link>
          )}
        </div>
        {c.isBanned && (
          <div className="bg-red-50 border-t border-red-200 text-red-700 text-xs text-center py-2 px-4">
            Your community access is suspended — you can read, but not post.
          </div>
        )}
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:pb-6">{children}</main>

      {/* Mobile bottom bar — the desktop nav is hidden on small screens. */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-black/10 bg-white/95 backdrop-blur">
        <div className="grid grid-cols-4 text-[11px] font-semibold">
          <Link to="/community" className="flex flex-col items-center gap-0.5 py-2 hover:bg-black/5">
            <Home className="h-4 w-4" /> Home
          </Link>
          <Link to="/community/search" search={{ q: "" } as any} className="flex flex-col items-center gap-0.5 py-2 hover:bg-black/5">
            <Search className="h-4 w-4" /> Search
          </Link>
          {c.signedIn && !c.needsUsername && c.canModerate ? (
            <Link to="/community/moderation" className="flex flex-col items-center gap-0.5 py-2 hover:bg-black/5">
              <Shield className="h-4 w-4" /> Mod
            </Link>
          ) : (
            <Link to="/community/new" className="flex flex-col items-center gap-0.5 py-2 hover:bg-black/5">
              <Plus className="h-4 w-4" /> Post
            </Link>
          )}
          <Link to="/" className="flex flex-col items-center gap-0.5 py-2 hover:bg-black/5 text-black/60">
            <ArrowLeft className="h-4 w-4" /> Find-am
          </Link>
        </div>
      </nav>

      <footer className="border-t border-black/5 py-6 px-4 space-y-3">
        <SocialLinks />
        <p className="text-center text-xs text-black/50">Find-am Community · Be kind, share knowledge, level up.</p>
      </footer>
    </div>
  );
}

const RANK_COLORS: Record<string, string> = {
  JJC: "bg-gray-200 text-gray-700",
  Contributor: "bg-emerald-100 text-emerald-800",
  Regular: "bg-sky-100 text-sky-800",
  Veteran: "bg-violet-100 text-violet-800",
  Agba: "bg-orange-100 text-orange-800",
  "OG👑": "bg-[#E5A54B] text-white",
};

export function RankBadge({ rank, points }: { rank?: string | null; points?: number }) {
  const key = rank ?? "JJC";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${RANK_COLORS[key] ?? RANK_COLORS.JJC}`}>
      {key}{typeof points === "number" ? ` · ${points}` : ""}
    </span>
  );
}

const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  admin: { label: "Admin", className: "bg-[#1a1a1a] text-[#E5A54B] ring-1 ring-[#E5A54B]/50" },
  super_moderator: { label: "Super mod", className: "bg-violet-600 text-white" },
  moderator: { label: "Mod", className: "bg-sky-600 text-white" },
  member: { label: "Member", className: "bg-black/10 text-black/60" },
};

const ROLE_ORDER = ["admin", "super_moderator", "moderator", "member"];

/** Normalise whatever role shape the service sends into badge keys. */
export function roleBadgeKeys(source?: unknown): string[] {
  const out = new Set<string>();
  const push = (v: unknown) => {
    if (typeof v !== "string") return;
    const k = v.toLowerCase().replace(/[\s-]+/g, "_");
    if (k === "supermoderator" || k === "super_mod" || k === "supermod") out.add("super_moderator");
    else if (k === "mod") out.add("moderator");
    else if (ROLE_BADGES[k]) out.add(k);
  };
  if (Array.isArray(source)) source.forEach(push);
  else push(source);
  return [...out].sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b));
}

/**
 * Role badges for a member. Pass `showMember` to tag ordinary members too
 * (used on profiles, where the absence of a badge reads as missing data).
 */
export function Badges({ badges, showMember = false }: { badges?: unknown; showMember?: boolean }) {
  const keys = roleBadgeKeys(badges).filter((k) => k !== "member");
  const shown = keys.length ? keys : showMember ? ["member"] : [];
  if (!shown.length) return null;
  return (
    <>
      {shown.map((b) => {
        const def = ROLE_BADGES[b]!;
        return (
          <span key={b} className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${def.className}`}>
            {def.label}
          </span>
        );
      })}
    </>
  );
}

/** Small author line: avatar, username, badges. */
export function AuthorChip({ author, size = 8 }: { author?: (AuthorCard & { roles?: unknown }) | null; size?: number }) {
  if (!author) return <span className="text-xs text-black/40 italic">removed</span>;
  return (
    <Link to="/community/u/$username" params={{ username: author.username }} className="inline-flex items-center gap-1.5 hover:text-[#E5A54B]">
      <img src={avatarUrl(author.avatar_key)} alt="" className="rounded-full object-cover bg-black/5" style={{ height: size * 4, width: size * 4 }} />
      <span className="text-xs font-semibold">{author.username_display ?? author.username}</span>
      <Badges badges={[...(Array.isArray(author.badges) ? author.badges : []), ...(Array.isArray((author as any).roles) ? (author as any).roles : [])]} />
    </Link>
  );
}
