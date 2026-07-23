import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ArrowLeft, MapPin, Clock, Loader2, Flag, ChevronDown, BadgeCheck, Star, Globe, CheckCircle2, RefreshCw, Wallet, CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { TaskHeader } from "@/components/TaskHeader";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  getTask, applyToTask, acceptApplicant, declineApplicant, sendMessage, listMessages, listTaskApplications, cancelTask, getMyApplications, walletBalance,
} from "@/lib/findtask.functions";

import { useAuth } from "@/lib/auth";
import { FeeBreakdown } from "@/components/FeeBreakdown";
import { computeFees, formatNaira } from "@/lib/fees";

export const Route = createFileRoute("/tasks/$taskId")({
  head: ({ params }) => ({
    meta: [
      { title: `Task #${params.taskId} — Find-task` },
      { name: "description", content: "View task details and make an offer on Find-task." },
    ],
  }),
  component: TaskDetail,
  errorComponent: TaskError,
  notFoundComponent: TaskNotFound,
});

function TaskError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error?.message ?? "We couldn't load this task."}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </main>
    </div>
  );
}

function TaskNotFound() {
  const { taskId } = Route.useParams();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-ink">Task not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">Task #{taskId} doesn't exist or has been removed.</p>
        <Link to="/tasks/browse" search={{ q: "", category_id: 0, location: "", is_remote: 0, page: 1 } as any} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
          Browse other tasks
        </Link>
      </main>
    </div>
  );
}

function TaskDetail() {
  const { taskId } = Route.useParams();
  const { token, user } = useAuth();
  const fetchTask = useServerFn(getTask);
  const apply = useServerFn(applyToTask);
  const accept = useServerFn(acceptApplicant);
  const send = useServerFn(sendMessage);
  const fetchMessages = useServerFn(listMessages);
  const fetchApps = useServerFn(listTaskApplications);
  const declineFn = useServerFn(declineApplicant);
  const walletFn = useServerFn(walletBalance);
  const cancelFn = useServerFn(cancelTask);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask({ data: { taskId } }),
  });

  const task: any = data?.ok ? ((data.data as any)?.task ?? data.data) : null;
  const myId = (user as any)?.user_id ?? (user as any)?.id;
  const posterId = task?.poster_id ?? task?.user_id ?? task?.owner_id;
  const isPoster = !!task && posterId !== undefined && String(posterId) === String(myId);

  // Poster fetches the full applications list (backend doesn't embed them in /task/:id)
  const appsQ = useQuery({
    queryKey: ["task", taskId, "apps", token],
    enabled: !!token && isPoster,
    queryFn: () => fetchApps({ data: { taskId, token: token! } }),
  });
  const fetchedApps: any[] = (() => {
    const r = appsQ.data;
    if (!r?.ok) return [];
    const d: any = r.data;
    return d?.applications ?? d?.applicants ?? d?.results ?? (Array.isArray(d) ? d : []);
  })();

  // Tasker (non-poster) fetches /my-applications so their own offer always shows on this task.
  const myAppsFn = useServerFn(getMyApplications);
  const myAppsQ = useQuery({
    queryKey: ["my-apps", token],
    enabled: !!token && !isPoster && !!task,
    queryFn: () => myAppsFn({ data: { token: token! } }),
  });
  const myOwnApp: any = (() => {
    const r = myAppsQ.data;
    if (!r?.ok) return null;
    const d: any = r.data;
    const list: any[] = d?.applications ?? d?.results ?? (Array.isArray(d) ? d : []);
    return list.find((a) => String(a.task_id ?? a.task?.task_id ?? a.task?.id) === String(taskId)) ?? null;
  })();

  // Merge: prefer fetched apps (poster), fall back to embedded on task, dedupe by applicant.
  const embeddedOffers: any[] = task?.applications ?? task?.offers ?? [];
  const mergedOffers: any[] = (() => {
    const byId = new Map<string, any>();
    const all = [...embeddedOffers, ...fetchedApps];
    if (myOwnApp) all.push({ ...myOwnApp, applicant_id: myOwnApp.applicant_id ?? myOwnApp.user_id ?? myId, applicant_name: myOwnApp.applicant_name ?? (user as any)?.name ?? "You" });
    all.forEach((o, i) => {
      const k = String(o.applicant_id ?? o.tasker_id ?? o.user_id ?? o.id ?? `idx-${i}`);
      byId.set(k, { ...(byId.get(k) ?? {}), ...o });
    });
    return Array.from(byId.values());
  })();

  // Visibility: poster sees all; everyone else sees only their own offer.
  const offers: any[] = isPoster
    ? mergedOffers
    : mergedOffers.filter((o) => String(o.applicant_id ?? o.tasker_id ?? o.user_id) === String(myId));

  const backendOfferCount = Number(
    task?.offers_count ?? task?.applications_count ?? task?.applicants_count ?? task?.offer_count ?? 0,
  );
  const totalOfferCount = Math.max(mergedOffers.length, backendOfferCount || 0);

  const myApplication: any = (() => {
    if (!mergedOffers.length) return null;
    if (task?.my_application) return task.my_application;
    return mergedOffers.find((a) => String(a.applicant_id ?? a.tasker_id ?? a.user_id) === String(myId)) ?? null;
  })();

  const questions: any[] = task?.comments ?? task?.questions ?? [];

  const [tab, setTab] = useState<"offers" | "questions">("offers");
  const [showApply, setShowApply] = useState(false);
  const [showOfferSuccess, setShowOfferSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [question, setQuestion] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);

  // Message thread
  const qaQ = useQuery({
    queryKey: ["task", taskId, "thread", token],
    enabled: !!token,
    queryFn: () => fetchMessages({ data: { taskId, token: token! } }),
  });
  const allMessages: any[] = useMemo(() => {
    const r = qaQ.data;
    if (!r?.ok) return [];
    return (r.data as any)?.messages ?? (Array.isArray(r.data) ? r.data : []);
  }, [qaQ.data]);
  const liveQuestions = allMessages.length ? allMessages : questions;

  // Wallet balance — used by the funding choice modal
  const walletQ = useQuery({
    queryKey: ["wallet", token],
    enabled: !!token && isPoster,
    queryFn: () => walletFn({ data: { token: token! } }),
  });
  const walletBal = walletQ.data?.ok ? Number((walletQ.data.data as any)?.withdrawable_balance ?? 0) : 0;

  const validOffer = message.trim().length >= 20 && message.trim().length <= 2000;

  const [applyError, setApplyError] = useState<string | null>(null);
  const applyM = useMutation({
    mutationFn: () => apply({
      data: {
        taskId,
        token: token!,
        message: message.trim(),
        earliest_start: startDate || undefined,
      },
    }),
    onSuccess: (r) => {
      if (r.ok) {
        setShowApply(false);
        setMessage("");
        setApplyError(null);
        setShowOfferSuccess(true);
        refetch();
        appsQ.refetch();
      } else {
        setApplyError(r.error);
        toast.error(r.error);
      }
    },
    onError: (e: any) => {
      const msg = e?.message ?? "Failed to send offer. Please try again.";
      setApplyError(msg);
      toast.error(msg);
    },
  });

  // Accept + funding flow
  const [payFor, setPayFor] = useState<any | null>(null);
  const [payStage, setPayStage] = useState<"confirm" | "processing" | "done">("confirm");
  const [payError, setPayError] = useState<string | null>(null);

  const acceptM = useMutation({
    mutationFn: async (v: { taskerId: string | number; funding_method: "wallet" | "flutterwave" }) =>
      await accept({ data: { taskId, taskerId: v.taskerId, funding_method: v.funding_method, token: token! } }),
  });

  const cancelM = useMutation({
    mutationFn: (reason?: string) => cancelFn({ data: { taskId, token: token!, reason } }),
    onSuccess: (r: any) => {
      if (r.ok) { toast.success("Task cancelled"); refetch(); }
      else toast.error(r.error);
    },
  });

  const declineM = useMutation({
    mutationFn: (taskerId: string) => declineFn({ data: { taskId, taskerId, token: token! } }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Application declined");
        appsQ.refetch();
        refetch();
      } else toast.error(r.error);
    },
  });

  const askM = useMutation({
    mutationFn: () => send({ data: { taskId, message_text: question.trim(), token: token! } }),
    onSuccess: (r) => {
      if (r.ok) { setQuestion(""); qaQ.refetch(); toast.success("Message sent"); }
      else toast.error(r.error);
    },
  });

  const status = String(task?.status ?? "open").toLowerCase();
  const WORKSPACE_STATUSES = new Set([
    "assigned", "accepted", "in_progress", "active",
    "completed_by_tasker", "pending_release", "awaiting_release", "work_submitted", "submitted",
    "completed", "released", "paid_out", "paid",
  ]);
  const useWorkspace = WORKSPACE_STATUSES.has(status) && (isPoster || (!!myApplication && String(myApplication?.status ?? "").toLowerCase() === "accepted"));
  const conversationTo = useWorkspace ? "/tasks/$taskId/workspace" : "/messages/$taskId";
  const location = task?.location_text ?? task?.location;
  const remote = !!task?.is_remote;
  const date = task?.deadline ? new Date(task.deadline) : null;
  const dateLabel = date
    ? date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })
    : "Flexible";

  const totalCharged = Number(task?.total_charged ?? 0);
  const canUseWallet = totalCharged > 0 && walletBal >= totalCharged;

  const StatusPill = ({ name }: { name: "open" | "assigned" | "completed" }) => {
    const active = status === name || (name === "assigned" && (status === "in_progress" || status === "accepted"));
    return (
      <span
        className={
          "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider " +
          (active ? "bg-success/15 text-success" : "text-muted-foreground")
        }
      >
        {name}
      </span>
    );
  };

  const openApplyModal = () => {
    if (!token) return;
    setShowApply(true);
  };

  const doAccept = async (funding_method: "wallet" | "flutterwave") => {
    if (!payFor) return;
    setPayError(null);
    setPayStage("processing");
    try {
      const r: any = await acceptM.mutateAsync({ taskerId: payFor._taskerId, funding_method });
      if (!r?.ok) {
        setPayError(r?.error ?? "Could not complete the request.");
        setPayStage("confirm");
        return;
      }
      const d: any = r.data ?? {};
      if (d.funded_from_wallet) {
        setPayStage("done");
        toast.success("Tasker accepted. Task funded from your wallet.");
        setPayFor(null);
        setPayStage("confirm");
        refetch(); appsQ.refetch(); walletQ.refetch();
        return;
      }
      if (d.payment_link) {
        setPayStage("done");
        window.location.href = d.payment_link;
        return;
      }
      setPayError("Accepted, but no payment link was returned. Please contact support.");
      setPayStage("confirm");
    } catch (e: any) {
      setPayError(e?.message ?? "Something went wrong.");
      setPayStage("confirm");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-24 sm:pb-0">
      <TaskHeader />

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 flex-1">
        {isFetching && !task ? (
          <div className="mt-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : !data?.ok ? (
          <div className="mt-8 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{data?.error ?? "Task not found."}</div>
        ) : !task ? (
          <div className="mt-8 text-muted-foreground">No task data.</div>
        ) : (
          <div className="grid md:grid-cols-[1fr_340px] gap-6">
            {/* MAIN COLUMN */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <StatusPill name="open" />
                  <StatusPill name="assigned" />
                  <StatusPill name="completed" />
                </div>
              </div>

              <h1 className="mt-4 font-display text-3xl sm:text-4xl text-ink leading-tight">{task.title ?? "Untitled task"}</h1>
              <Link
                to="/tasks/browse"
                search={{ q: "", category_id: 0, location: "", is_remote: 0, page: 1 }}
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Return to browse
              </Link>

              <dl className="mt-6 space-y-4 border-t border-border pt-6">
                <div className="flex items-start gap-3">
                  {posterId != null ? (
                    <Link
                      to="/u/$userId"
                      params={{ userId: String(posterId) }}
                      className="flex items-start gap-3 flex-1 min-w-0 hover:opacity-90"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary font-bold">
                        {(task.poster_name ?? "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Posted by</dt>
                        <dd className="font-semibold text-ink hover:text-primary hover:underline">{task.poster_name ?? "Anonymous"}</dd>
                      </div>
                    </Link>
                  ) : (
                    <>
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary font-bold">
                        {(task.poster_name ?? "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Posted by</dt>
                        <dd className="font-semibold text-ink">{task.poster_name ?? "Anonymous"}</dd>
                      </div>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {task.created_at ? new Date(task.created_at).toLocaleDateString() : ""}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                    {remote ? <Globe className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                  </span>
                  <div className="flex-1">
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Location</dt>
                    <dd className="font-semibold text-ink">{remote ? "Remote" : (location ?? "On-site")}</dd>
                  </div>
                  {!remote && (
                    <Link to="/map" className="text-sm font-semibold text-primary hover:underline shrink-0">View map</Link>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                    <Clock className="h-5 w-5" />
                  </span>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">To be done on</dt>
                    <dd className="font-semibold text-ink">{dateLabel}</dd>
                    {!date && <div className="text-xs text-muted-foreground">Anytime</div>}
                  </div>
                </div>
              </dl>

              <section className="mt-8 border-t border-border pt-6">
                <h2 className="font-display text-2xl text-ink">Details</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">
                  {task.description ?? "No description provided."}
                </p>
              </section>

              {/* Milestones */}
              {Array.isArray(task.milestones) && task.milestones.length > 0 && (
                <section className="mt-8 border-t border-border pt-6">
                  <h2 className="font-display text-2xl text-ink">Milestones</h2>
                  <div className="mt-3 space-y-2">
                    {task.milestones.map((m: any) => (
                      <div key={m.milestone_id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-ink text-sm truncate">{m.title}</div>
                          <div className="text-xs text-muted-foreground capitalize">{m.status}</div>
                        </div>
                        <div className="font-display text-lg text-ink shrink-0">₦{Number(m.amount ?? 0).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Offers / Messages */}
              <section className="mt-8">
                <div className="inline-flex w-full sm:w-auto rounded-full bg-muted p-1">
                  <button
                    onClick={() => setTab("offers")}
                    className={
                      "flex-1 sm:flex-initial rounded-full px-6 py-2 text-sm font-bold transition " +
                      (tab === "offers" ? "bg-ink text-background" : "text-muted-foreground")
                    }
                  >
                    Offers <span className="ml-1 opacity-70">{totalOfferCount}</span>
                  </button>
                  <button
                    onClick={() => setTab("questions")}
                    className={
                      "flex-1 sm:flex-initial rounded-full px-6 py-2 text-sm font-bold transition " +
                      (tab === "questions" ? "bg-ink text-background" : "text-muted-foreground")
                    }
                  >
                    Messages
                    <span className="ml-1 opacity-70">{liveQuestions.length}</span>
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  {tab === "offers" ? (
                    <>
                      {!isPoster && token && totalOfferCount > 0 && (
                        <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                          {offers.length > 0
                            ? "Only you and the poster can see your offer. Other taskers' offers are private to the poster."
                            : `There ${totalOfferCount === 1 ? "is" : "are"} ${totalOfferCount} private offer${totalOfferCount === 1 ? "" : "s"} on this task — only the poster can view them.`}
                        </div>
                      )}
                      {!isPoster && !token && totalOfferCount > 0 && (
                        <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                          Offers are private — only the poster can see them.
                        </div>
                      )}
                      {offers.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
                          No offers yet. {!isPoster && token && status === "open" && (
                            <button onClick={openApplyModal} className="text-primary font-bold hover:underline">Be the first to make one →</button>
                          )}
                        </div>
                      ) : (
                        offers.map((o, i) => {
                          const tid = o.applicant_id ?? o.tasker_id ?? o.user_id;
                          const oStatus = String(o.status ?? "pending").toLowerCase();
                          return (
                            <OfferCard
                              key={i}
                              offer={o}
                              taskBudget={Number(task.budget ?? 0)}
                              isMine={String(tid) === String(myId)}
                              showActions={isPoster && status === "open" && oStatus === "pending"}
                              onAccept={() => {
                                if (tid == null) return;
                                setPayFor({ ...o, _taskerId: tid });
                                setPayStage("confirm");
                                setPayError(null);
                              }}
                              onDecline={() => {
                                if (tid == null) return;
                                if (!confirm("Decline this application? This can't be undone.")) return;
                                declineM.mutate(String(tid));
                              }}
                              accepting={acceptM.isPending}
                              declining={declineM.isPending}
                            />
                          );
                        })
                      )}
                    </>
                  ) : (
                    <>
                      {token && (
                        <div className="rounded-2xl border border-border bg-card p-4">
                          <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            rows={3}
                            placeholder={isPoster ? "Send a message to the tasker…" : "Send a message to the poster…"}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          />
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">
                              Messaging opens once a tasker is accepted and the task is funded.
                            </span>
                            <button
                              onClick={() => askM.mutate()}
                              disabled={askM.isPending || question.trim().length < 3}
                              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                            >
                              {askM.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                              Send message
                            </button>
                          </div>
                        </div>
                      )}
                      {liveQuestions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">No messages yet.</div>
                      ) : (
                        liveQuestions.map((q, i) => <QuestionCard key={i} q={q} posterId={posterId} />)
                      )}
                    </>
                  )}
                </div>
              </section>

              <section className="mt-10 border-t border-border pt-6">
                <h3 className="font-display text-xl text-ink">Cancellation policy</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You can cancel this task free of charge any time before a tasker is assigned. Once a tasker is assigned and the task is funded, cancellation is locked — use the dispute process instead.
                </p>
                <Link to="/refund" className="mt-2 inline-block text-sm font-bold text-primary hover:underline">Refund policy</Link>
              </section>
            </div>

            {/* RIGHT SIDEBAR */}
            <aside className="md:sticky md:top-[120px] h-fit space-y-4">
              <div className="rounded-3xl border border-border bg-card p-6 text-center">
                <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Task budget</div>
                <div className="mt-2 font-display text-5xl text-ink">
                  ₦{Number(task.budget ?? 0).toLocaleString()}
                </div>
                {isPoster ? (
                  <div className="mt-5 space-y-2">
                    <Link to="/tasks/$taskId/applications" params={{ taskId }} className="block w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90">
                      View applications
                    </Link>
                    <Link to="/tasks/$taskId/workspace" params={{ taskId }} className="block w-full rounded-full border border-border py-3 text-sm font-bold hover:bg-muted">
                      Open workspace
                    </Link>
                    {status === "open" ? (
                      <button
                        onClick={() => {
                          if (!confirm("Cancel this task? Any pending offers will be closed.")) return;
                          cancelM.mutate(undefined);
                        }}
                        disabled={cancelM.isPending}
                        className="w-full rounded-full border border-destructive/40 text-destructive py-2.5 text-sm font-bold hover:bg-destructive/5 disabled:opacity-50"
                      >
                        {cancelM.isPending ? "Cancelling…" : "Cancel task"}
                      </button>
                    ) : status !== "completed" && status !== "cancelled" ? (
                      <>
                        <div className="rounded-xl border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
                          Task is assigned — cancellation is locked. Use the workspace to coordinate or open a dispute.
                        </div>
                        <Link
                          to="/tasks/$taskId/workspace"
                          params={{ taskId }}
                          search={{ dispute: 1 } as any}
                          className="block w-full rounded-full border border-destructive/40 text-destructive py-2.5 text-sm font-bold hover:bg-destructive/5"
                        >
                          Open dispute
                        </Link>
                      </>
                    ) : null}
                  </div>
                ) : !token ? (
                  <Link to="/login" search={{ redirect: `/tasks/${taskId}` } as any} className="mt-5 block w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90">
                    Log in to make an offer
                  </Link>
                ) : myApplication ? (
                  <div className="mt-5 space-y-2">
                    <Link to={conversationTo} params={{ taskId }} className="block w-full rounded-full border border-primary text-primary py-3 text-sm font-bold hover:bg-primary/5">
                      {status !== "open" ? "Open conversation" : "Offer sent · Open conversation"}
                    </Link>
                    {status !== "open" && status !== "completed" && status !== "cancelled" && (
                      <Link
                        to="/tasks/$taskId/workspace"
                        params={{ taskId }}
                        search={{ dispute: 1 } as any}
                        className="block w-full rounded-full border border-destructive/40 text-destructive py-2.5 text-sm font-bold hover:bg-destructive/5"
                      >
                        Open dispute
                      </Link>
                    )}
                  </div>
                ) : status !== "open" ? (
                  <div className="mt-5 rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground capitalize">
                    Task is {status}
                  </div>
                ) : (
                  <button onClick={openApplyModal} className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90">
                    Make an offer
                  </button>
                )}
              </div>

              <button
                onClick={() => setMoreOpen((v) => !v)}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold inline-flex items-center justify-between hover:bg-muted"
              >
                More Options
                <ChevronDown className={"h-4 w-4 transition " + (moreOpen ? "rotate-180" : "")} />
              </button>
              {moreOpen && (
                <div className="rounded-2xl border border-border bg-card p-4 text-sm space-y-2">
                  <button className="w-full text-left hover:text-primary">Share this task</button>
                  <button className="w-full text-left hover:text-primary">Copy task link</button>
                </div>
              )}
              <button className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-destructive">
                <Flag className="h-3.5 w-3.5" /> Report this task
              </button>
            </aside>
          </div>
        )}
      </main>

      {/* Sticky mobile bottom bar */}
      {task && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-background border-t border-border px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)]">
          <div className="flex items-end justify-between mb-2">
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">{task.title ?? "Task"}</div>
              <div className="text-xs text-muted-foreground">{dateLabel} · {remote ? "Remote" : (location ?? "On-site")}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-display text-xl text-ink">₦{Number(task.budget ?? 0).toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Task Budget</div>
            </div>
          </div>
          {!isPoster && token && status === "open" && !myApplication && (
            <button onClick={openApplyModal} className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground">
              Make an offer
            </button>
          )}
          {!token && (
            <Link to="/login" className="block w-full text-center rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground">
              Log in to make an offer
            </Link>
          )}
          {myApplication && (
            <Link to={conversationTo} params={{ taskId }} className="block w-full text-center rounded-full border border-primary text-primary py-3 text-sm font-bold">
              Open conversation
            </Link>
          )}
        </div>
      )}

      {/* Make an offer modal */}
      <Dialog open={showApply} onOpenChange={setShowApply}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-ink">Make an offer</DialogTitle>
            <DialogDescription>
              Tell the poster why you're a great fit. Be specific — clear offers get accepted faster.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-muted/60 px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Task budget</div>
                <div className="text-xs text-muted-foreground mt-0.5">Set by the poster · cannot be changed</div>
              </div>
              <div className="font-display text-2xl text-ink">₦{Number(task?.budget ?? 0).toLocaleString()}</div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message to poster</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Hi! I've done similar tasks and can start right away. Here's how I'd approach it…"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                maxLength={2000}
                autoFocus
              />
              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                <span>Min 20 characters</span>
                <span>{message.trim().length}/2000</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Earliest start (optional)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          {applyError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <div className="font-semibold">{applyError}</div>
              {/verify|verif/i.test(applyError) && (
                <Link
                  to="/verify-email"
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground hover:opacity-90"
                >
                  Verify your email →
                </Link>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              onClick={() => setShowApply(false)}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={() => applyM.mutate()}
              disabled={!validOffer || applyM.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {applyM.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {applyM.isPending ? "Sending…" : "Submit offer"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Funding choice modal — fires before accept */}
      <Dialog open={!!payFor} onOpenChange={(o) => { if (!o && payStage !== "processing") { setPayFor(null); setPayStage("confirm"); setPayError(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <DialogTitle className="font-display text-2xl text-ink mt-2 text-center">
              Accept {payFor?.applicant_name ?? payFor?.tasker_name ?? payFor?.name ?? "tasker"}?
            </DialogTitle>
            <DialogDescription className="text-center">
              Task funds are held until you mark the task complete, then released to the tasker.
            </DialogDescription>
          </DialogHeader>

          {payFor && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Task</span><span className="font-semibold text-ink truncate ml-2">{task?.title}</span></div>
              </div>
              <FeeBreakdown budget={Number(task?.budget ?? 0)} />
              <div className="rounded-xl bg-primary/10 px-4 py-3 flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-wider font-bold text-primary">Total to pay</span>
                <span className="font-display text-2xl text-ink">
                  {totalCharged > 0 ? formatNaira(totalCharged) : formatNaira(computeFees(Number(task?.budget ?? 0)).total)}
                </span>
              </div>
            </div>
          )}

          {payError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{payError}</div>
          )}

          <div className="space-y-2 pt-1">
            <button
              disabled={!canUseWallet || payStage === "processing"}
              onClick={() => doAccept("wallet")}
              className="w-full rounded-xl border border-border p-3 text-left hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              <Wallet className="h-5 w-5 text-primary shrink-0" />
              <span className="flex-1">
                <span className="block font-semibold text-sm">Use wallet balance</span>
                <span className="block text-xs text-muted-foreground">
                  {walletQ.isFetching
                    ? "Checking balance…"
                    : canUseWallet
                      ? `${formatNaira(walletBal)} available`
                      : `Insufficient balance — ${formatNaira(walletBal)} available`}
                </span>
              </span>
            </button>

            <button
              disabled={payStage === "processing"}
              onClick={() => doAccept("flutterwave")}
              className="w-full rounded-xl border border-border p-3 text-left hover:bg-muted disabled:opacity-50 flex items-center gap-3"
            >
              <CreditCard className="h-5 w-5 text-primary shrink-0" />
              <span className="flex-1">
                <span className="block font-semibold text-sm">Pay with card</span>
                <span className="block text-xs text-muted-foreground">You'll be redirected to complete payment</span>
              </span>
            </button>
          </div>

          {payStage === "processing" && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              onClick={() => { setPayFor(null); setPayStage("confirm"); setPayError(null); }}
              disabled={payStage === "processing"}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offer submitted success modal */}
      <Dialog open={showOfferSuccess} onOpenChange={setShowOfferSuccess}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <DialogTitle className="font-display text-2xl text-ink mt-3">Offer submitted!</DialogTitle>
            <DialogDescription>
              Your offer was sent to the poster. You'll be notified the moment they reply or accept it.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-left text-xs text-muted-foreground">
            Only you and the poster can see your offer and any messages — it's private.
          </div>
          <DialogFooter className="gap-2 sm:gap-2 sm:justify-center">
            <button
              onClick={() => setShowOfferSuccess(false)}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              Keep browsing
            </button>
            <Link
              to="/tasks/$taskId/workspace"
              params={{ taskId }}
              onClick={() => setShowOfferSuccess(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Open conversation
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OfferCard({
  offer, taskBudget, isMine, showActions, onAccept, onDecline, accepting, declining,
}: {
  offer: any; taskBudget: number; isMine: boolean;
  showActions: boolean;
  onAccept: () => void; onDecline: () => void; accepting: boolean; declining: boolean;
}) {
  const name = offer.applicant_name ?? offer.tasker_name ?? offer.user_name ?? offer.name ?? "Tasker";
  const applicantId = offer.applicant_id ?? offer.tasker_id ?? offer.user_id ?? null;
  const rating = offer.rating ?? offer.average_rating ?? null;
  const ratings = Number(offer.ratings_count ?? offer.rating_count ?? offer.review_count ?? 0);
  const completion = offer.completion_rate ?? null;
  const cleanMsg = offer.message ?? offer.comment ?? offer.body ?? "Hi! I'd love to help with this task.";
  const time = offer.applied_at
    ? new Date(offer.applied_at).toLocaleDateString()
    : (offer.created_at ? new Date(offer.created_at).toLocaleDateString() : "Recently");
  const amount = Number(taskBudget);
  const isRejected = String(offer.status ?? "").toLowerCase() === "rejected";

  const AvatarEl = (
    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-lg text-primary">
      {String(name).charAt(0).toUpperCase()}
    </div>
  );

  return (
    <article className={"rounded-2xl border bg-card p-5 " + (isRejected ? "border-destructive/30 opacity-70" : "border-border")}>
      <div className="flex items-start gap-3">
        {applicantId ? (
          <Link to="/u/$userId" params={{ userId: String(applicantId) }} className="shrink-0 hover:opacity-80">{AvatarEl}</Link>
        ) : AvatarEl}
        <div className="min-w-0 flex-1">
          <div className="font-bold text-ink inline-flex items-center gap-1.5">
            {applicantId ? (
              <Link to="/u/$userId" params={{ userId: String(applicantId) }} className="hover:text-primary hover:underline">{name}</Link>
            ) : name}
            <BadgeCheck className="h-4 w-4 text-primary" />
            {isMine && <span className="ml-1 text-[10px] uppercase tracking-wider rounded-full bg-primary/10 text-primary px-2 py-0.5">You</span>}
            {isRejected && <span className="ml-1 text-[10px] uppercase tracking-wider rounded-full bg-destructive/10 text-destructive px-2 py-0.5">Not selected</span>}
          </div>
          <div className="text-sm text-ink flex items-center gap-1.5 mt-0.5">
            {rating != null && ratings > 0 ? (
              <>
                <span className="font-bold">{Number(rating).toFixed(1)}</span>
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span className="text-muted-foreground">({ratings})</span>
              </>
            ) : (
              <span className="text-muted-foreground text-xs">No ratings yet</span>
            )}
          </div>
          {completion != null && (
            <div className="text-sm font-semibold text-ink mt-0.5">{completion}% Completion rate</div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-xl text-ink">₦{amount.toLocaleString()}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Task budget</div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-muted/60 p-4 text-sm text-ink whitespace-pre-wrap">{cleanMsg}</div>

      {offer.earliest_start && (
        <div className="mt-2 text-xs text-muted-foreground">Can start: {offer.earliest_start}</div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{time}</span>
        <div className="flex items-center gap-2 ml-auto">
          {showActions && (
            <>
              <button
                onClick={onDecline}
                disabled={declining || accepting}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
              >
                {declining ? "Declining…" : "Decline"}
              </button>
              <button
                onClick={onAccept}
                disabled={accepting || declining}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {accepting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Accept
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function QuestionCard({ q, posterId }: { q: any; posterId?: any }) {
  const name = q.sender_name ?? q.user_name ?? q.name ?? "User";
  const body = q.message_text ?? q.message ?? q.body ?? q.text ?? "";
  const time = q.created_at ? new Date(q.created_at).toLocaleString() : "Recently";
  const senderId = q.sender_id ?? q.user_id ?? q.from_id;
  const isPosterMsg = posterId != null && senderId != null && String(senderId) === String(posterId);
  const isSystem = q.is_system === 1 || q.is_system === true;

  if (isSystem) {
    return (
      <div className="text-center">
        <span className="inline-block rounded-full bg-muted px-4 py-1.5 text-xs text-muted-foreground">{body}</span>
      </div>
    );
  }

  return (
    <article className={"rounded-2xl border bg-card p-4 " + (isPosterMsg ? "border-primary/40 bg-primary/5" : "border-border")}>
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary font-bold text-sm">
          {String(name).charAt(0).toUpperCase()}
        </div>
        <div className="font-semibold text-ink text-sm">{name}</div>
        {isPosterMsg && (
          <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Poster</span>
        )}
        <div className="text-xs text-muted-foreground ml-auto">{time}</div>
      </div>
      <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap">{body}</p>
    </article>
  );
}
