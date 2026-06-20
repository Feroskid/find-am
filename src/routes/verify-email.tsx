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
  validateSearch: (s) =>
    z.object({
      token: z.string().optional(),
      verification_token: z.string().optional(),
      email_verification_token: z.string().optional(),
      code: z.string().optional(),
    }).parse(s),
  head: () => ({ meta: [{ title: "Verify your email — Find-task" }] }),
  component: VerifyEmail,
});

function VerifyEmail() {
  const search = useSearch({ from: "/verify-email" });
  const linkToken = search.token ?? search.verification_token ?? search.email_verification_token ?? search.code;
  return <EmailVerificationPage linkToken={linkToken} />;
}

export function EmailVerificationPage({ linkToken }: { linkToken?: string }) {
  const { token, user } = useAuth();
  const verify = useServerFn(verifyEmail);
  const resend = useServerFn(resendVerification);

  const userEmail = (user as any)?.email ?? "";
  const [status, setStatus] = useState<"idle" | "verifying" | "ok" | "error">(linkToken ? "verifying" : "idle");
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState(userEmail);
  const [effectiveToken, setEffectiveToken] = useState(linkToken);

  useEffect(() => { if (userEmail && !email) setEmail(userEmail); }, [userEmail]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (linkToken || typeof window === "undefined") return;
    const rawHash = window.location.hash.replace(/^#/, "");
    if (!rawHash) return;
    const hashParams = new URLSearchParams(rawHash);
    const hashToken = hashParams.get("token") ?? hashParams.get("verification_token") ?? hashParams.get("email_verification_token") ?? hashParams.get("code") ?? undefined;
    if (hashToken) setEffectiveToken(hashToken);
  }, [linkToken]);

  // Auto-verify when the user clicks the link in their inbox.
  useEffect(() => {
    if (!effectiveToken) return;
    setStatus("verifying");
    (async () => {
      const r = await verify({ data: { token: effectiveToken } });
      if (r.ok) { setStatus("ok"); setMsg("Your email has been verified. You're all set."); }
      else { setStatus("error"); setMsg(r.error || "This verification link is invalid or has expired."); }
    })();
  }, [effectiveToken, verify]);

  const resendM = useMutation({
    mutationFn: async () => {
      if (!token) return { ok: false as const, status: 401, error: "Please log in before requesting a new verification link." };
      return resend({ data: { email: email.trim(), token } });
    },
    onSuccess: (r) => {
      setStatus(r.ok ? "idle" : "error");
      setMsg(r.ok ? "We've sent a new verification link. Check your inbox (and spam)." : r.error);
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="flex-1 mx-auto max-w-lg w-full px-4 sm:px-6 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 grid place-items-center text-primary">
            {status === "verifying"
              ? <Loader2 className="h-7 w-7 animate-spin" />
              : status === "ok" ? <CheckCircle2 className="h-7 w-7" />
              : status === "error" ? <AlertCircle className="h-7 w-7" />
              : <MailCheck className="h-7 w-7" />}
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            {status === "ok"
              ? "Email verified"
              : status === "verifying"
              ? "Verifying your email…"
              : status === "error"
              ? "Verification failed"
              : "Verify your email"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {status === "ok" || status === "error"
              ? msg
              : status === "verifying"
              ? "Hang tight while we confirm your email."
              : `We've sent a verification link to ${email || "your email"}. Open it from your inbox to confirm your account — no codes needed.`}
          </p>

          {status === "ok" ? (
            <Link to="/dashboard" className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
              Continue to dashboard
            </Link>
          ) : status !== "verifying" && (
            <>
              <div className="mt-6 rounded-lg bg-muted/40 p-4 text-left">
                <div className="text-xs font-medium text-muted-foreground">Didn't get the link?</div>
                <div className="mt-2 flex flex-col sm:flex-row gap-2">
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
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {resendM.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {resendM.isPending ? "Sending…" : "Resend link"}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Tip: check your spam folder. The link expires after a short while — request a new one if it stops working.
                </p>
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
