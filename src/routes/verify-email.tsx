import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, MailCheck } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { Footer } from "@/components/Footer";
import { verifyEmail, resendVerification } from "@/lib/findtask.functions";
import { useAuth } from "@/lib/auth";
import { z } from "zod";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (s) => z.object({ token: z.string().optional() }).parse(s),
  head: () => ({ meta: [{ title: "Verify your email — Find-task" }] }),
  component: VerifyEmail,
});

function VerifyEmail() {
  const { token: linkToken } = useSearch({ from: "/verify-email" });
  const { user } = useAuth();
  const verify = useServerFn(verifyEmail);
  const resend = useServerFn(resendVerification);

  const userEmail = (user as any)?.email ?? "";
  const [status, setStatus] = useState<"idle" | "verifying" | "ok" | "error">(linkToken ? "verifying" : "idle");
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState(userEmail);
  const [code, setCode] = useState("");

  useEffect(() => { if (userEmail && !email) setEmail(userEmail); }, [userEmail]);

  // Auto-verify if a link token is present in the URL.
  useEffect(() => {
    if (!linkToken) return;
    (async () => {
      const r = await verify({ data: { token: linkToken } });
      if (r.ok) { setStatus("ok"); setMsg("Your email has been verified."); }
      else { setStatus("error"); setMsg(r.error || "This link is invalid or expired."); }
    })();
  }, [linkToken, verify]);

  const codeM = useMutation({
    mutationFn: () => verify({ data: { token: code.trim() } }),
    onSuccess: (r) => {
      if (r.ok) { setStatus("ok"); setMsg("Your email has been verified."); }
      else { setStatus("error"); setMsg(r.error || "Invalid or expired code."); }
    },
  });

  const resendM = useMutation({
    mutationFn: () => resend({ data: { email: email.trim() } }),
    onSuccess: (r) => setMsg(r.ok ? "Verification code sent. Check your inbox." : r.error),
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="flex-1 mx-auto max-w-lg w-full px-4 sm:px-6 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 grid place-items-center text-primary">
            {status === "verifying" || codeM.isPending ? <Loader2 className="h-7 w-7 animate-spin" />
              : status === "ok" ? <CheckCircle2 className="h-7 w-7" />
              : status === "error" ? <AlertCircle className="h-7 w-7" />
              : <MailCheck className="h-7 w-7" />}
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            {status === "ok" ? "Email verified" : "Verify your email"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {status === "ok"
              ? msg
              : `We sent a verification code to ${email || "your email"}. Enter it below to confirm it's really you.`}
          </p>

          {status === "ok" ? (
            <Link to="/dashboard" className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
              Continue to dashboard
            </Link>
          ) : (
            <>
              <form
                onSubmit={(e) => { e.preventDefault(); if (code.trim().length >= 4) codeM.mutate(); }}
                className="mt-6 space-y-3 text-left"
              >
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Verification code</span>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9A-Za-z-]/g, "").slice(0, 12))}
                    placeholder="123456"
                    className="mt-1 w-full text-center tracking-[0.4em] text-lg font-semibold rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <button
                  type="submit"
                  disabled={codeM.isPending || code.trim().length < 4}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {codeM.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Verify code
                </button>
              </form>

              <div className="mt-5 rounded-lg bg-muted/40 p-3 text-left">
                <div className="text-xs font-medium text-muted-foreground">Didn't get it?</div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <button
                    disabled={resendM.isPending || !email}
                    onClick={() => resendM.mutate()}
                    className="rounded-full bg-foreground/90 text-background px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    {resendM.isPending ? "Sending…" : "Resend"}
                  </button>
                </div>
              </div>

              {msg && (
                <div className={`mt-4 rounded-lg p-2.5 text-sm ${status === "error" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                  {msg}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
