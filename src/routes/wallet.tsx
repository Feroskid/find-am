import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";
import { TaskHeader } from "@/components/TaskHeader";
import { useAuth } from "@/lib/auth";
import { walletBalance, walletTransactions, withdrawFunds } from "@/lib/findtask.functions";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Wallet — Find-task" }] }),
  component: WalletPage,
});

function WalletPage() {
  const { token, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && !token) navigate({ to: "/login", search: { redirect: "/wallet" } as any });
  }, [token, navigate]);

  const bFn = useServerFn(walletBalance);
  const tFn = useServerFn(walletTransactions);
  const wFn = useServerFn(withdrawFunds);

  const bQ = useQuery({ queryKey: ["wallet", token], enabled: !!token, queryFn: () => bFn({ data: { token: token! } }) });
  const tQ = useQuery({ queryKey: ["wallet-tx", token], enabled: !!token, queryFn: () => tFn({ data: { token: token! } }) });

  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");

  const withdraw = useMutation({
    mutationFn: () =>
      wFn({
        data: {
          amount: Number(amount),
          bank_code: bank.trim() || undefined,
          account_number: account.trim() || undefined,
          token: token!,
        },
      }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Withdrawal requested.");
        setAmount("");
        bQ.refetch(); tQ.refetch();
      } else toast.error(r.error);
    },
  });

  if (!token) return null;
  const bal: any = bQ.data?.ok ? bQ.data.data : null;
  const balance = bal?.balance ?? bal?.available_balance ?? 0;
  const pending = bal?.pending ?? bal?.in_escrow ?? null;
  const txs: any[] = tQ.data?.ok
    ? ((tQ.data.data as any)?.transactions ?? (tQ.data.data as any)?.results ?? (Array.isArray(tQ.data.data) ? tQ.data.data : []))
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 flex-1">
        <h1 className="text-3xl font-bold tracking-tight inline-flex items-center gap-2">
          <WalletIcon className="h-7 w-7" /> Wallet
        </h1>
        <p className="mt-1 text-muted-foreground">Earnings from completed tasks land here. Paystack handles transfers to your verified bank.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Available balance</div>
            <div className="mt-1 text-3xl font-bold">₦{Number(balance ?? 0).toLocaleString()}</div>
          </div>
          {pending != null && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">In escrow</div>
              <div className="mt-1 text-3xl font-bold">₦{Number(pending ?? 0).toLocaleString()}</div>
            </div>
          )}
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold inline-flex items-center gap-2"><ArrowDownCircle className="h-5 w-5" /> Withdraw</h2>
          <form
            className="mt-3 grid gap-3 sm:grid-cols-3"
            onSubmit={(e) => { e.preventDefault(); if (Number(amount) > 0) withdraw.mutate(); }}
          >
            <input className="input" placeholder="Amount (₦)" type="number" min={100} value={amount} onChange={(e) => setAmount(e.target.value)} />
            <input className="input" placeholder="Bank code" value={bank} onChange={(e) => setBank(e.target.value)} />
            <input className="input" placeholder="Account number" value={account} onChange={(e) => setAccount(e.target.value)} />
            <button
              type="submit" disabled={withdraw.isPending || !Number(amount)}
              className="sm:col-span-3 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {withdraw.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Request withdrawal
            </button>
          </form>
          <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:transparent;border-radius:0.5rem;padding:0.55rem 0.75rem;font-size:0.875rem;outline:none}.input:focus{border-color:hsl(var(--primary))}`}</style>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold inline-flex items-center gap-2"><ArrowUpCircle className="h-5 w-5" /> Recent transactions</h2>
          <div className="mt-3 rounded-2xl border border-border bg-card divide-y divide-border">
            {tQ.isFetching ? (
              <div className="p-6 text-muted-foreground inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
            ) : txs.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm">No transactions yet.</div>
            ) : (
              txs.map((t: any, i: number) => (
                <div key={t.id ?? t.transaction_id ?? i} className="p-4 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{t.description ?? t.type ?? "Transaction"}</div>
                    <div className="text-xs text-muted-foreground">{t.created_at && new Date(t.created_at).toLocaleString()}</div>
                  </div>
                  <div className={`font-semibold ${Number(t.amount) < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                    ₦{Number(t.amount ?? 0).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
