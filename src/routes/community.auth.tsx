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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/community" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup") {
      if (password.length < 6) return toast.error("Password must be at least 6 characters");
      if (password !== confirmPassword) return toast.error("Passwords do not match");
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/community` },
        });
        if (error) throw error;
        // If email confirmation is off, session is set immediately.
        if (data.session) {
          toast.success("Welcome to the community!");
          navigate({ to: "/community" });
          return;
        }
        // Fall back: try signing in directly (in case confirmation is off but no session returned).
        const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signErr) {
          toast.success("Account created. Please check your email to confirm, then sign in.");
          setMode("signin");
          return;
        }
        navigate({ to: "/community" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/community" });
      }
    } catch (e: any) {
      toast.error(e.message ?? "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommunityShell>
      <div className="mx-auto max-w-md mt-8 rounded-2xl bg-white border border-black/10 p-6">
        <h1 className="font-bold text-2xl">{mode === "signin" ? "Welcome back" : "Join the community"}</h1>
        <p className="text-sm text-black/60 mt-1">Community account is separate from your Find-Task app account.</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full rounded-lg border border-black/15 px-3 py-2.5 outline-none focus:border-[#E5A54B]"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6)"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="w-full rounded-lg border border-black/15 px-3 py-2.5 outline-none focus:border-[#E5A54B]"
          />
          {mode === "signup" && (
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
              className="w-full rounded-lg border border-black/15 px-3 py-2.5 outline-none focus:border-[#E5A54B]"
            />
          )}
          <button disabled={busy} className="w-full rounded-lg bg-[#E5A54B] text-white font-bold py-2.5 disabled:opacity-60">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setConfirmPassword("");
          }}
          className="mt-4 text-sm text-black/60 hover:text-black"
        >
          {mode === "signin" ? "New here? Create an account" : "Already a member? Sign in"}
        </button>
      </div>
    </CommunityShell>
  );
}
