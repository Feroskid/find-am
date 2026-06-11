import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, MailCheck } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { Footer } from "@/components/Footer";
import { verifyEmail, resendVerification } from "@/lib/findtask.functions";
import { z } from "zod";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (s) => z.object({ token: z.string().optional() }).parse(s),
  head: () => ({ meta: [{ title: "Verify your email — Find-task" }] }),
  component: VerifyEmail,
});

function VerifyEmail() {
  const { token } = useSearch({ from: "/verify-email" });
  const verify = useServerFn(verifyEmail);
  const resend = useServerFn(resendVerification);
  const [status, setStatus] = useState<"idle" | "verifying" | "ok" | "error">(token ? "verifying" : "idle");
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      const r = await verify({ data: { token } });
      if (r.ok) {
        setStatus("ok");
        setMsg("Your email has been verified. You can now sign in.");
      } else {
        setStatus("error");
        setMsg(r.error || "This link is invalid or has expired.");
      }
    })();
  }, [token, verify]);

  const resendM = useMutation({
    mutationFn: () => resend({ data: { email: email.trim() } }),
    onSuccess: (r) => setMsg(r.ok ? "Verification email sent. Check your inbox." : r.error),
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="flex-1 mx-auto max-w-lg w-full px-4 sm:px-6 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 grid place-items-center text-primary">
            {status === "verifying" ? <Loader2 className="h-7 w-7 animate-spin" />
              : status === "ok" ? <CheckCircle2 className="h-7 w-7" />
              : status === "error" ? <AlertCircle className="h-7 w-7" />
              : <MailCheck className="h-7 w-7" />}
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            {status === "ok" ? "Email verified" : status === "error" ? "We couldn't verify that link" : "Verify your email"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {status === "idle"
              ? "Click the link in the email we sent you. If you didn't get it, request a new one below."
              : msg}
          </p>

          {status === "ok" && (
            <Link to="/login" className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
              Continue to login
            </Link>
          )}

          {(status === "idle" || status === "error") && (
            <form
              onSubmit={(e) => { e.preventDefault(); if (email) resendM.mutate(); }}
              className="mt-6 flex flex-col gap-2"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                disabled={resendM.isPending}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {resendM.isPending ? "Sending…" : "Resend verification email"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
