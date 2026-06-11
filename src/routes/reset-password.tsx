import { createFileRoute, useSearch, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, KeyRound, Mail, Lock } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { Footer } from "@/components/Footer";
import { PasswordInput } from "@/components/PasswordInput";
import { forgotPassword, resetPassword } from "@/lib/findtask.functions";
import { z } from "zod";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s) => z.object({ token: z.string().optional() }).parse(s),
  head: () => ({ meta: [{ title: "Reset password — Find-task" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const { token } = useSearch({ from: "/reset-password" });
  const navigate = useNavigate();
  const forgot = useServerFn(forgotPassword);
  const reset = useServerFn(resetPassword);

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const forgotM = useMutation({
    mutationFn: () => forgot({ data: { email: email.trim() } }),
    onSuccess: (r) => r.ok ? (setMsg("Check your inbox for a reset link."), setErr(null)) : setErr(r.error),
  });
  const resetM = useMutation({
    mutationFn: () => reset({ data: { token: token!, new_password: pw } }),
    onSuccess: (r) => {
      if (r.ok) { setMsg("Password updated."); setTimeout(() => navigate({ to: "/login" }), 1200); }
      else setErr(r.error);
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="flex-1 mx-auto max-w-md w-full px-4 sm:px-6 py-12">
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 grid place-items-center text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-center text-2xl font-bold tracking-tight">
            {token ? "Set a new password" : "Reset your password"}
          </h1>

          {!token ? (
            <form onSubmit={(e) => { e.preventDefault(); forgotM.mutate(); }} className="mt-6 space-y-3">
              <label className="block">
                <span className="text-sm font-medium">Email address</span>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" placeholder="you@example.com" />
                </div>
              </label>
              <button disabled={forgotM.isPending} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {forgotM.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (pw.length >= 6 && pw === pw2) resetM.mutate(); else setErr("Passwords must match and be at least 6 characters."); }} className="mt-6 space-y-3">
              <label className="block">
                <span className="text-sm font-medium">New password</span>
                <div className="mt-1">
                  <PasswordInput required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 6 characters" />
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-medium">Confirm new password</span>
                <div className="mt-1">
                  <PasswordInput required minLength={6} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Repeat password" />
                </div>
              </label>
              <button disabled={resetM.isPending} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {resetM.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Update password
              </button>
            </form>
          )}

          {msg && <div className="mt-3 rounded-lg bg-primary/10 text-primary text-sm p-2.5">{msg}</div>}
          {err && <div className="mt-3 rounded-lg bg-destructive/10 text-destructive text-sm p-2.5">{err}</div>}

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Remembered it? <Link to="/login" className="text-primary font-medium hover:underline">Back to login</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
