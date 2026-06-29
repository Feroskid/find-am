import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { TaskHeader } from "@/components/TaskHeader";
import { paymentCallback, sendMessage, getTask } from "@/lib/findtask.functions";
import { useAuth } from "@/lib/auth";

const Search = z.object({
  tx_ref: z.string().optional(),
  transaction_id: z.string().optional(),
  status: z.string().optional(),
  task_id: z.string().optional(),
  tasker_id: z.string().optional(),
});

export const Route = createFileRoute("/tasks/payment/callback")({
  validateSearch: (s) => Search.parse(s),
  head: () => ({ meta: [{ title: "Confirming payment — Find-task" }] }),
  component: PaymentCallbackPage,
});

function PaymentCallbackPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { token } = useAuth();
  const cb = useServerFn(paymentCallback);
  const send = useServerFn(sendMessage);
  const fetchTask = useServerFn(getTask);
  const [stage, setStage] = useState<"working" | "ok" | "fail">("working");
  const [msg, setMsg] = useState<string>("Confirming your payment with Flutterwave…");

  useEffect(() => {
    const tx_ref = search.tx_ref;
    const transaction_id = search.transaction_id;
    const status = search.status;
    if (!tx_ref || !transaction_id || !status) {
      setStage("fail");
      setMsg("Missing payment confirmation details. If you completed the payment, check your wallet or the task page for status.");
      return;
    }
    (async () => {
      const r = await cb({ data: { tx_ref, transaction_id, status } });
      if (r.ok && /success|paid|completed/i.test(status)) {
        setStage("ok");
        setMsg("Payment confirmed. Escrow funded — opening the conversation with your tasker.");
        // Fire-and-forget: open a chat thread with the tasker.
        if (token && search.task_id) {
          try {
            let title = "this task";
            try {
              const tr: any = await fetchTask({ data: { taskId: search.task_id } });
              title = tr?.data?.task?.title ?? tr?.data?.title ?? title;
            } catch {}
            await send({ data: { taskId: search.task_id, token, message_text: `🎉 Offer accepted! Your offer on "${title}" has been accepted and payment is held in escrow. Let's coordinate next steps here.` } });
          } catch {}
        }
      } else if (r.ok) {
        setStage("fail");
        setMsg(`Payment status: ${status}. No funds were captured.`);
      } else {
        setStage("fail");
        setMsg(r.error || "Could not confirm payment.");
      }
    })();
  }, [search.tx_ref, search.transaction_id, search.status, search.task_id, cb, send, fetchTask, token]);


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
          {search.task_id && (
            <Link
              to="/tasks/$taskId"
              params={{ taskId: search.task_id }}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
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
