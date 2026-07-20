import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { paymentCallback } from "@/lib/findtask.functions";

// Backend redirects here after Flutterwave with tx_ref / transaction_id / status.
// The backend callback finalises funding AND opens the message thread itself,
// so this page only confirms the result to the user and redirects.
const toStr = z.union([z.string(), z.number()]).optional().transform((v) => (v === undefined ? undefined : String(v)));
const Search = z.object({
  tx_ref: toStr,
  transaction_id: toStr,
  status: toStr,
});

export const Route = createFileRoute("/task/payment/callback")({
  validateSearch: (s) => Search.parse(s),
  head: () => ({ meta: [{ title: "Confirming payment — Find-task" }] }),
  component: PaymentCallbackPage,
});

function deriveTaskId(tx?: string): string | null {
  if (!tx) return null;
  const m = tx.match(/findtask[-_](\d+)/i);
  return m ? m[1] : null;
}

function PaymentCallbackPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const cb = useServerFn(paymentCallback);
  const [stage, setStage] = useState<"working" | "ok" | "fail">("working");
  const [msg, setMsg] = useState("Confirming your payment with Flutterwave…");
  const taskId = deriveTaskId(search.tx_ref);

  useEffect(() => {
    const { tx_ref, transaction_id, status } = search;
    if (!tx_ref || !transaction_id || !status) {
      setStage("fail");
      setMsg("Missing payment confirmation details.");
      return;
    }
    (async () => {
      const r = await cb({ data: { tx_ref, transaction_id, status } });
      const successful = /success|paid|completed/i.test(status);
      if (r.ok && successful) {
        setStage("ok");
        setMsg("Payment confirmed. Opening your task…");
        // Redirect regardless of token — the workspace handles auth itself.
        if (taskId) {
          setTimeout(() => navigate({ to: "/tasks/$taskId/workspace", params: { taskId } }), 1200);
        }
      } else if (r.ok) {
        setStage("fail");
        setMsg(`Payment status: ${status}. No funds were captured.`);
      } else {
        setStage("fail");
        setMsg(r.error || "Could not confirm payment.");
      }
    })();
  }, [search.tx_ref, search.transaction_id, search.status, taskId, cb, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-md px-4 py-16 text-center flex-1">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          {stage === "working" && <Loader2 className="h-8 w-8 animate-spin" />}
          {stage === "ok" && <CheckCircle2 className="h-8 w-8 text-emerald-500" />}
          {stage === "fail" && <XCircle className="h-8 w-8 text-destructive" />}
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {stage === "working" && "Finalising payment…"}
          {stage === "ok" && "Payment confirmed"}
          {stage === "fail" && "Payment not confirmed"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{msg}</p>
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {taskId && (
            <Link
              to="/tasks/$taskId/workspace"
              params={{ taskId }}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Open workspace
            </Link>
          )}
          {taskId && (
            <Link
              to="/tasks/$taskId"
              params={{ taskId }}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              Back to task
            </Link>
          )}
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            Go to dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
