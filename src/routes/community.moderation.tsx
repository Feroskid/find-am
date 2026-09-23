import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Loader2 } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { RolesPanel } from "@/components/community/RolesPanel";
import { ModerationQueue } from "@/components/community/ModerationQueue";
import { useCommunityMe } from "@/lib/community-client";

export const Route = createFileRoute("/community/moderation")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Moderation — Find-am Community" },
      { name: "description", content: "Review reports and take action on community content." },
    ],
  }),
  component: ModPage,
});

function ModPage() {
  const c = useCommunityMe();

  if (c.loading) {
    return (
      <CommunityShell>
        <div className="py-16 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-black/40" /></div>
      </CommunityShell>
    );
  }

  if (!c.signedIn) {
    return (
      <CommunityShell>
        <div className="text-center py-16">
          <Shield className="h-12 w-12 mx-auto text-black/20 mb-3" />
          <p className="text-sm text-black/60">Sign in to open the moderation queue.</p>
          <Link to="/login" className="mt-3 inline-block text-sm text-[#E5A54B] font-semibold hover:underline">Sign in</Link>
        </div>
      </CommunityShell>
    );
  }

  if (!c.canModerate || !c.token) {
    return (
      <CommunityShell>
        <div className="text-center py-16">
          <Shield className="h-12 w-12 mx-auto text-black/20 mb-3" />
          <p className="text-sm text-black/60">You don't have moderator access.</p>
          <Link to="/community" className="mt-3 inline-block text-sm text-[#E5A54B] font-semibold hover:underline">Back to the community</Link>
        </div>
      </CommunityShell>
    );
  }

  const title = c.roles.includes("admin")
    ? "Admin dashboard"
    : c.isSuperMod
      ? "Super moderator dashboard"
      : "Moderator dashboard";

  return (
    <CommunityShell>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h1 className="font-bold text-2xl inline-flex items-center gap-2"><Shield className="h-5 w-5" /> {title}</h1>
        <span className="text-xs text-black/50">
          Everything you do here is recorded for the Find-am admin team.
        </span>
      </div>

      {c.isSuperMod && <RolesPanel token={c.token} />}

      <ModerationQueue token={c.token} fallbackSuper={c.isSuperMod} />
    </CommunityShell>
  );
}
