import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CommunityShell } from "@/components/community/CommunityShell";
import { getMyCommunityProfile, updateCommunityProfile } from "@/lib/community.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/community/settings")({
  head: () => ({ meta: [{ title: "Settings — Find-Task Community" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/community/auth" });
      else setReady(true);
    });
  }, [navigate]);
  const getFn = useServerFn(getMyCommunityProfile);
  const updFn = useServerFn(updateCommunityProfile);
  const q = useQuery({ queryKey: ["community-me"], queryFn: () => getFn(), enabled: ready });

  const [form, setForm] = useState({ display_name: "", username: "", bio: "", signature: "", avatar_url: "" });
  useEffect(() => {
    if (q.data?.ok && q.data.data) {
      const p = q.data.data;
      setForm({ display_name: p.display_name ?? "", username: p.username ?? "", bio: p.bio ?? "", signature: p.signature ?? "", avatar_url: p.avatar_url ?? "" });
    }
  }, [q.data]);

  const save = useMutation({
    mutationFn: () => {
      const payload: any = {};
      for (const [k, v] of Object.entries(form)) if (v) payload[k] = v;
      return updFn({ data: payload });
    },
    onSuccess: (r) => r.ok ? toast.success("Profile saved") : toast.error(r.error),
  });

  if (!ready) return null;

  const Field = ({ label, k, type = "text", area = false }: any) => (
    <label className="block">
      <span className="text-xs font-semibold text-black/70 uppercase tracking-wider">{label}</span>
      {area ? (
        <textarea value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} rows={3}
          className="mt-1 w-full rounded-lg border border-black/15 p-2.5 text-sm outline-none focus:border-[#E5A54B]" />
      ) : (
        <input type={type} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
          className="mt-1 w-full rounded-lg border border-black/15 p-2.5 text-sm outline-none focus:border-[#E5A54B]" />
      )}
    </label>
  );

  return (
    <CommunityShell>
      <h1 className="font-bold text-2xl mb-4">Profile settings</h1>
      <div className="rounded-2xl bg-white border border-black/10 p-6 space-y-4 max-w-xl">
        <Field label="Display name" k="display_name" />
        <Field label="Username" k="username" />
        <Field label="Avatar URL" k="avatar_url" />
        <Field label="Bio" k="bio" area />
        <Field label="Signature" k="signature" area />
        <button disabled={save.isPending} onClick={() => save.mutate()} className="rounded-lg bg-[#E5A54B] text-white px-5 py-2 font-bold text-sm disabled:opacity-50">
          {save.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </CommunityShell>
  );
}
