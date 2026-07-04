import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CommunityShell } from "@/components/community/CommunityShell";

export const Route = createFileRoute("/community/auth")({
  head: () => ({ meta: [{ title: "Sign in — Find-Task Community" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/community" }); });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/community` },
        });
        if (error) throw error;
        toast.success("Account created. You're in!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/community" });
    } catch (e: any) {
      toast.error(e.message ?? "Auth failed");
    } finally { setBusy(false); }
  };

  return (
    <CommunityShell>
      <div className="mx-auto max-w-md mt-8 rounded-2xl bg-white border border-black/10 p-6">
        <h1 className="font-bold text-2xl">{mode === "signin" ? "Welcome back" : "Join the community"}</h1>
        <p className="text-sm text-black/60 mt-1">Community account is separate from your Find-Task app account.</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-black/15 px-3 py-2.5 outline-none focus:border-[#E5A54B]" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6)" className="w-full rounded-lg border border-black/15 px-3 py-2.5 outline-none focus:border-[#E5A54B]" />
          <button disabled={busy} className="w-full rounded-lg bg-[#E5A54B] text-white font-bold py-2.5 disabled:opacity-60">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 text-sm text-black/60 hover:text-black">
          {mode === "signin" ? "New here? Create an account" : "Already a member? Sign in"}
        </button>
      </div>
    </CommunityShell>
  );
}
