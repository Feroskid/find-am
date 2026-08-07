import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, ShieldCheck, Landmark } from "lucide-react";
import { toast } from "sonner";
import { TaskHeader } from "@/components/TaskHeader";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import {
  walletBalance, walletTransactions, withdrawFunds, listBanks, verifyKyc, getMe,
} from "@/lib/findtask.functions";

/** Backend errors can be a string, an array of FastAPI validation objects, or an object. */
function errText(e: any, fallback = "Something went wrong. Please try again."): string {
  if (!e) return fallback;
  if (typeof e === "string") return e.trim() || fallback;
  if (Array.isArray(e)) return e.map((x) => x?.msg ?? JSON.stringify(x)).join(", ") || fallback;
  if (typeof e === "object") return e.msg ?? e.detail ?? e.message ?? JSON.stringify(e);
  return String(e);
}

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Wallet — Find-task" }] }),
  component: WalletPage,
});

function WalletPage() {
  const { token, ready } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && !token) navigate({ to: "/login", search: { redirect: "/wallet" } as any });
  }, [token, ready, navigate]);

  const bFn = useServerFn(walletBalance);
  const tFn = useServerFn(walletTransactions);
  const wFn = useServerFn(withdrawFunds);
  const banksFn = useServerFn(listBanks);
  const kycFn = useServerFn(verifyKyc);
  const meFn = useServerFn(getMe);

  const bQ = useQuery({ queryKey: ["wallet", token], enabled: !!token, queryFn: () => bFn({ data: { token: token! } }) });
  const tQ = useQuery({ queryKey: ["wallet-tx", token], enabled: !!token, queryFn: () => tFn({ data: { token: token! } }) });
  const banksQ = useQuery({ queryKey: ["banks"], queryFn: () => banksFn({}), staleTime: 60 * 60_000 });
  const meQ = useQuery({ queryKey: ["me", token], enabled: !!token, queryFn: () => meFn({ data: { token: token! } }) });

  const [amount, setAmount] = useState("");
  const [showKyc, setShowKyc] = useState(false);

  // /banks may return { banks: [...] } or a bare array.
  const banks: any[] = useMemo(() => {
    const d: any = banksQ.data?.ok ? banksQ.data.data : null;
    if (!d) return [];
    return d.banks ?? d.data ?? d.results ?? (Array.isArray(d) ? d : []);
  }, [banksQ.data]);

  const withdraw = useMutation({
    mutationFn: () =>
      wFn({ data: { amount: Number(amount), token: token! } }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Withdrawal requested.");
        setAmount("");
        bQ.refetch(); tQ.refetch();
      } else toast.error(errText(r.error));
    },
  });

  if (!token) return null;
  const bal: any = bQ.data?.ok ? bQ.data.data : null;
  const me: any = meQ.data?.ok ? ((meQ.data.data as any)?.user ?? meQ.data.data) : null;
  // Backend /wallet/balance returns withdrawable_balance (same key the dashboard reads).
  const balance =
    bal?.withdrawable_balance ?? bal?.available_balance ?? bal?.balance ?? bal?.wallet_balance ?? 0;
  const pending =
    bal?.frozen_balance ?? bal?.escrow_balance ?? bal?.pending ?? bal?.in_escrow ?? null;
  const kycVerified = !!(
    bal?.kyc_verified ?? bal?.bvn_verified ?? me?.kyc_verified ?? me?.bvn_verified ?? me?.is_kyc_verified
  );
  const savedBank: any = useMemo(() => {
    const code = bal?.bank_code ?? me?.bank_code;
    const acctNum = bal?.account_number ?? me?.account_number ?? me?.bank_account_number;
    if (!code && !acctNum) return null;
    const matched = banks.find((b: any) => String(b.code) === String(code));
    return {
      bank_code: code,
      bank_name: matched?.name ?? null,
      account_number: acctNum,
      account_name: me?.account_name ?? me?.bank_account_name,
    };
  }, [bal, me, banks]);
  const txs: any[] = tQ.data?.ok
    ? ((tQ.data.data as any)?.transactions ?? (tQ.data.data as any)?.results ?? (Array.isArray(tQ.data.data) ? tQ.data.data : []))
    : [];
  const refreshAccount = () => { bQ.refetch(); meQ.refetch(); };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 flex-1">
        <h1 className="text-3xl font-bold tracking-tight inline-flex items-center gap-2">
          <WalletIcon className="h-7 w-7" /> Wallet
        </h1>
        <p className="mt-1 text-muted-foreground">Earnings from completed tasks land here. Flutterwave handles transfers to your verified bank.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Available balance</div>
            <div className="mt-1 text-3xl font-bold">
              {bQ.isPending ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>₦{Number(balance ?? 0).toLocaleString()}</>
              )}
            </div>
            {!bQ.isPending && bQ.data && !bQ.data.ok && (
              <div className="mt-1 text-xs text-destructive">{errText((bQ.data as any).error, "Couldn't load your balance.")}</div>
            )}
          </div>
          {pending != null && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">In escrow</div>
              <div className="mt-1 text-3xl font-bold">₦{Number(pending ?? 0).toLocaleString()}</div>
            </div>
          )}
        </div>


        {/* KYC + bank account cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className={"h-4 w-4 " + (kycVerified ? "text-emerald-500" : "text-muted-foreground")} />
                KYC verification
              </div>
              <span className={"text-xs font-bold uppercase tracking-wider " + (kycVerified ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                {kycVerified ? "Verified" : "Required"}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Required by Flutterwave before payouts. Verify your BVN against your bank account.</p>
            {!kycVerified && (
              <button onClick={() => setShowKyc(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90">
                Verify BVN
              </button>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-semibold">
                <Landmark className="h-4 w-4" /> Payout bank
              </div>
              <button onClick={() => setShowKyc(true)} className="text-xs font-semibold text-primary hover:underline">
                {savedBank ? "Change" : "Add"}
              </button>
            </div>
            {savedBank ? (
              <div className="mt-2 text-sm">
                <div className="font-semibold">{savedBank.account_name ?? "Account"}</div>
                <div className="text-xs text-muted-foreground">{savedBank.bank_name ?? savedBank.bank_code} · ••••{String(savedBank.account_number ?? "").slice(-4)}</div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">No bank account on file. Add one so we know where to send your earnings.</p>
            )}
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold inline-flex items-center gap-2"><ArrowDownCircle className="h-5 w-5" /> Withdraw</h2>

          {!savedBank ? (
            <div className="mt-3 rounded-xl border border-dashed border-border p-5 text-center">
              <p className="text-sm text-muted-foreground">Add a payout bank before you can withdraw.</p>
              <button onClick={() => setShowKyc(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90">
                <Landmark className="h-3.5 w-3.5" /> Add payout bank
              </button>
            </div>
          ) : !kycVerified ? (
            <div className="mt-3 rounded-xl border border-dashed border-amber-400/50 bg-amber-500/5 p-5 text-center">
              <p className="text-sm text-muted-foreground">Complete BVN verification before you can withdraw.</p>
              <button onClick={() => setShowKyc(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90">
                <ShieldCheck className="h-3.5 w-3.5" /> Verify BVN
              </button>
            </div>
          ) : (
            <>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2.5 text-sm">
                <Landmark className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Withdrawing to</span>
                <span className="font-semibold ml-auto">{savedBank.bank_name ?? savedBank.bank_code} · ••••{String(savedBank.account_number ?? "").slice(-4)}</span>
              </div>

              <form
                className="mt-3 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const amt = Number(amount);
                  if (amt < 1000) { toast.error("Minimum withdrawal is ₦1,000"); return; }
                  if (amt > Number(balance ?? 0)) { toast.error("Amount exceeds your withdrawable balance"); return; }
                  withdraw.mutate();
                }}
              >
                <input
                  className="input"
                  placeholder="Amount (₦)"
                  type="number"
                  min={1000}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {amount && Number(amount) > Number(balance ?? 0) && (
                  <p className="text-xs text-destructive">You only have ₦{Number(balance ?? 0).toLocaleString()} available.</p>
                )}
                <button
                  type="submit"
                  disabled={withdraw.isPending || !Number(amount) || Number(amount) < 1000 || Number(amount) > Number(balance ?? 0)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {withdraw.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Request withdrawal
                </button>
                <p className="text-[11px] text-muted-foreground text-center">Minimum ₦1,000 · Up to 3 withdrawals per day · Sent to your saved bank</p>
              </form>
            </>
          )}
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
              txs.map((t: any, i: number) => {
                const isReversed = String(t.status).toLowerCase() === "reversed";
                const isDebit = String(t.type).toLowerCase() === "debit";
                return (
                  <div key={t.id ?? t.transaction_id ?? i} className={`p-4 flex items-center justify-between text-sm ${isReversed ? "opacity-60" : ""}`}>
                    <div>
                      <div className="font-medium inline-flex items-center gap-2">
                        {t.description ?? t.type ?? "Transaction"}
                        {isReversed && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Reversed
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{t.created_at && new Date(t.created_at).toLocaleString()}</div>
                    </div>
                    <div className={`font-semibold ${isReversed ? "text-muted-foreground line-through" : isDebit ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {isDebit ? "−" : "+"}₦{Number(t.amount ?? 0).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      <KycDialog
        open={showKyc}
        onOpenChange={setShowKyc}
        banks={banks}
        kycFn={(args: any) => kycFn({ data: { ...args, token: token! } })}
        onDone={refreshAccount}
      />
    </div>
  );
}

function KycDialog({ open, onOpenChange, banks, kycFn, onDone }: any) {
  const [bvn, setBvn] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [acct, setAcct] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify your BVN</DialogTitle>
          <DialogDescription>Required by Flutterwave before payouts. Your BVN is encrypted in transit and never displayed back.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="11-digit BVN" inputMode="numeric" maxLength={11} value={bvn} onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))} />
          <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={bankCode} onChange={(e) => setBankCode(e.target.value)}>
            <option value="">Select bank</option>
            {banks.map((b: any) => <option key={b.id ?? b.code} value={b.code}>{b.name}</option>)}
          </select>
          <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Account number" value={acct} onChange={(e) => setAcct(e.target.value.replace(/\D/g, ""))} />
          {err && <div className="text-xs text-destructive">{err}</div>}
        </div>
        <DialogFooter className="gap-2">
          <button onClick={() => onOpenChange(false)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">Cancel</button>
          <button
            disabled={submitting || bvn.length !== 11 || !bankCode || acct.length < 10}
            onClick={async () => {
              setErr(null); setSubmitting(true);
              let r: any;
              try {
                r = await kycFn({ bvn, bank_code: bankCode, account_number: acct });
              } catch (e: any) {
                r = { ok: false, error: e?.message ?? "Network error" };
              }
              setSubmitting(false);
              if (r?.ok) { toast.success("BVN verified"); onOpenChange(false); onDone?.(); }
              else { const m = errText(r?.error, "BVN verification failed."); setErr(m); toast.error(m); }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Submit
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

