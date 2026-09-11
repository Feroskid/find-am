import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AtSign, Loader2 } from "lucide-react";
import { CommunityShell } from "@/components/community/CommunityShell";
import { useCommunityMe, communityError } from "@/lib/community-client";
import { setCommunityUsername } from "@/lib/community.functions";

export const Route = createFileRoute("/community/username")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Choose your community username — Find-Task" },
      { name: "description", content: "Pick the name other members see in the Find-Task community." },
    ],
  }),
  component: UsernamePage,
});

const VALID = /^[A-Za-z0-9_]{3,20}$/;

function UsernamePage() {
  const navigate = useNavigate();
  const c = useCommunityMe();
  const saveFn = useServerFn(setCommunityUsername);
  const [name, setName] = useState("");

  useEffect(() => {
    if (c.ready && !c.signedIn) navigate({ to: "/login" });
  }, [c.ready, c.signedIn, navigate]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: { token: c.token!, username: name.trim() } }),
    onSuccess: async (r) => {
      if (!r.ok) return toast.error(communityError(r));
      toast.success("Username set — welcome in!");
      await c.refetch();
      navigate({ to: "/community" });
    },
  });

  const valid = VALID.test(name.trim());

  return (
    <CommunityShell>
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl bg-white border border-black/10 p-6">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#E5A54B]/10 text-[#E5A54B] mb-3">
            <AtSign className="h-5 w-5" />
          </div>
          <h1 className="font-bold text-2xl">Choose your community name</h1>
          <p className="text-sm text-black/60 mt-2">
            This is the only name other members see. Your real name, email and phone stay private.
            3 to 20 characters — letters, numbers and underscore. You can change it once every 30 days.
          </p>

          {c.me?.username ? (
            <div className="mt-4 text-sm">
              You're already known as <span className="font-semibold">@{c.me.username_display ?? c.me.username}</span>.{" "}
              <Link to="/community/settings" className="text-[#E5A54B] font-semibold hover:underline">Change it in settings</Link>
            </div>
          ) : (
            <>
              <label className="block mt-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-black/60">Username</span>
                <div className="mt-1 flex items-center rounded-lg border border-black/15 focus-within:border-[#E5A54B] px-3">
                  <span className="text-black/40">@</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={20}
                    placeholder="lagos_hustler"
                    className="flex-1 py-2.5 px-1 text-sm outline-none bg-transparent"
                  />
                </div>
              </label>
              {name && !valid && (
                <p className="text-xs text-red-600 mt-1">Use 3–20 letters, numbers or underscores.</p>
              )}
              <button
                disabled={!valid || save.isPending}
                onClick={() => save.mutate()}
                className="mt-4 w-full rounded-lg bg-[#E5A54B] text-white py-2.5 font-bold text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Continue
              </button>
            </>
          )}
        </div>
      </div>
    </CommunityShell>
  );
}
