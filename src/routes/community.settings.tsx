import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { updateCommunityProfile, setCommunityUsername } from "@/lib/community.functions";
import { ALL_AVATAR_KEYS, avatarUrl, DEFAULT_AVATAR_KEY } from "@/lib/community-avatars";
import { useCommunityMe, communityError } from "@/lib/community-client";

export const Route = createFileRoute("/community/settings")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Community profile settings — Find-Task" },
      { name: "description", content: "Change your community picture, bio, signature and username." },
    ],
  }),
  component: SettingsPage,
});

const VALID_NAME = /^[A-Za-z0-9_]{3,20}$/;
const CHANGE_DAYS = 30;

function daysUntilChange(changedAt?: string | null) {
  if (!changedAt) return 0;
  const next = new Date(changedAt).getTime() + CHANGE_DAYS * 86400000;
  return Math.max(0, Math.ceil((next - Date.now()) / 86400000));
}

function SettingsPage() {
  const navigate = useNavigate();
  const c = useCommunityMe();
  const updFn = useServerFn(updateCommunityProfile);
  const nameFn = useServerFn(setCommunityUsername);

  const [avatarKey, setAvatarKey] = useState(DEFAULT_AVATAR_KEY);
  const [bio, setBio] = useState("");
  const [signature, setSignature] = useState("");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (c.ready && !c.signedIn) navigate({ to: "/login" });
    else if (c.needsUsername) navigate({ to: "/community/username" });
  }, [c.ready, c.signedIn, c.needsUsername, navigate]);

  useEffect(() => {
    if (c.me) {
      setAvatarKey(c.me.avatar_key ?? DEFAULT_AVATAR_KEY);
      setBio(c.me.bio ?? "");
      setSignature(c.me.signature ?? "");
    }
  }, [c.me?.username]);

  const save = useMutation({
    mutationFn: () => updFn({ data: { token: c.token!, avatar_key: avatarKey, bio, signature } }),
    onSuccess: async (r) => {
      if (!r.ok) return toast.error(communityError(r));
      await c.refetch();
      toast.success("Profile saved");
    },
  });

  const changeName = useMutation({
    mutationFn: () => nameFn({ data: { token: c.token!, username: newName.trim() } }),
    onSuccess: async (r) => {
      if (!r.ok) return toast.error(communityError(r));
      setNewName("");
      await c.refetch();
      toast.success("Username updated");
    },
  });

  if (c.loading || !c.me) {
    return <CommunityShell><div className="py-16 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-black/40" /></div></CommunityShell>;
  }

  const wait = daysUntilChange(c.me.username_changed_at);

  return (
    <CommunityShell>
      <h1 className="font-bold text-2xl mb-4">Profile settings</h1>

      <div className="rounded-2xl bg-white border border-black/10 p-6 space-y-5 max-w-xl">
        <div>
          <span className="text-xs font-semibold text-black/70 uppercase tracking-wider">Profile picture</span>
          <div className="mt-2 flex items-center gap-3">
            <img src={avatarUrl(avatarKey)} alt="" className="h-14 w-14 rounded-full object-cover bg-black/5" />
            <p className="text-xs text-black/60">Pick any of the 60 pictures below.</p>
          </div>
          <div className="mt-3 grid grid-cols-8 sm:grid-cols-10 gap-2">
            {ALL_AVATAR_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setAvatarKey(k)}
                aria-label={`Avatar ${k}`}
                className={`rounded-full overflow-hidden border-2 ${avatarKey === k ? "border-[#E5A54B]" : "border-transparent"}`}
              >
                <img src={avatarUrl(k)} alt="" className="h-9 w-9 object-cover" />
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-semibold text-black/70 uppercase tracking-wider">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={1000}
            className="mt-1 w-full rounded-lg border border-black/15 p-2.5 text-sm outline-none focus:border-[#E5A54B]"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-black/70 uppercase tracking-wider">Signature</span>
          <textarea
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            rows={2}
            maxLength={300}
            className="mt-1 w-full rounded-lg border border-black/15 p-2.5 text-sm outline-none focus:border-[#E5A54B]"
          />
        </label>

        <button
          disabled={save.isPending}
          onClick={() => save.mutate()}
          className="rounded-lg bg-[#E5A54B] text-white px-5 py-2 font-bold text-sm disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>

      <div className="mt-6 rounded-2xl bg-white border border-black/10 p-6 max-w-xl">
        <h2 className="font-bold text-lg">Username</h2>
        <p className="text-sm text-black/60 mt-1">
          You're known as <span className="font-semibold">@{c.me.username_display ?? c.me.username}</span>.
          {wait > 0 ? ` You can change it again in ${wait} day${wait === 1 ? "" : "s"}.` : " You can change it once every 30 days."}
        </p>
        {wait === 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={20}
              placeholder="new_username"
              className="flex-1 min-w-[180px] rounded-lg border border-black/15 p-2.5 text-sm outline-none focus:border-[#E5A54B]"
            />
            <button
              disabled={!VALID_NAME.test(newName.trim()) || changeName.isPending}
              onClick={() => changeName.mutate()}
              className="rounded-lg bg-[#1a1a1a] text-white px-4 py-2 font-semibold text-sm disabled:opacity-50"
            >
              {changeName.isPending ? "Saving…" : "Change"}
            </button>
          </div>
        )}
        <Link to="/community/u/$username" params={{ username: c.me.username }} className="mt-4 inline-block text-sm text-[#E5A54B] font-semibold hover:underline">
          View my public profile →
        </Link>
      </div>
    </CommunityShell>
  );
}
