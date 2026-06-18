import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, MapPin, Clock, Loader2, Heart, Flag, ChevronDown, BadgeCheck, Star, Globe, CheckCircle2, RefreshCw, MessageSquare, X as XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { TaskHeader } from "@/components/TaskHeader";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  getTask, applyToTask, acceptApplicant, sendMessage, listMessages,
} from "@/lib/findtask.functions";
import { useAuth } from "@/lib/auth";
import {
  parseOfferAmount, parseReplyTarget, parseCounterTarget, isDecline, stripHeaders, formatOfferMessage,
} from "@/lib/offerParse";

export const Route = createFileRoute("/tasks/$taskId")({
  head: ({ params }) => ({
    meta: [
      { title: `Task #${params.taskId} — Find-task` },
      { name: "description", content: "View task details, make an offer or negotiate with the poster on Find-task." },
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

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask({ data: { taskId } }),
  });

  const task: any = data?.ok ? ((data.data as any)?.task ?? data.data) : null;
  const myId = (user as any)?.user_id ?? (user as any)?.id;
  const posterId = task?.poster_id ?? task?.user_id ?? task?.owner_id;
  const isPoster = !!task && posterId !== undefined && String(posterId) === String(myId);

  const myApplication: any = (() => {
    const t: any = task;
    if (!t) return null;
    if (t.my_application) return t.my_application;
    const apps: any[] = t.applications ?? [];
    return apps.find((a) => String(a.applicant_id ?? a.tasker_id ?? a.user_id) === String(myId)) ?? null;
  })();

  const offers: any[] = task?.applications ?? task?.offers ?? [];
  const questions: any[] = task?.comments ?? task?.questions ?? [];

  const [tab, setTab] = useState<"offers" | "questions">("offers");
  const [showApply, setShowApply] = useState(false);
  const [offerAmt, setOfferAmt] = useState("");
  const [message, setMessage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [question, setQuestion] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [counterFor, setCounterFor] = useState<any | null>(null);
  const [counterAmt, setCounterAmt] = useState("");
  const [counterMsg, setCounterMsg] = useState("");

  // Message thread — used for Q&A and per-offer counter/reply rendering
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
  const liveQuestions = allMessages.length ? allMessages.filter((m: any) => {
    const body = m.message_text ?? m.message ?? m.body ?? "";
    return !parseCounterTarget(body) && !parseReplyTarget(body) && !isDecline(body);
  }) : questions;

  // Initialise offer amount with task budget on first load
  useEffect(() => {
    if (task && !offerAmt) setOfferAmt(String(task.budget ?? ""));
  }, [task]); // eslint-disable-line react-hooks/exhaustive-deps

  const amtNum = Number(offerAmt);
  const validOffer = amtNum >= 100 && message.trim().length >= 20 && message.trim().length <= 2000;

  const applyM = useMutation({
    mutationFn: () => apply({
      data: {
        taskId,
        token: token!,
        message: formatOfferMessage({ kind: "OFFER", amount: amtNum, body: message.trim(), startDate: startDate || undefined }),
      },
    }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Offer sent!");
        setShowApply(false);
        setMessage("");
        refetch();
      } else toast.error(r.error);
    },
  });

  const acceptM = useMutation({
    mutationFn: (taskerId: string | number) =>
      accept({ data: { taskId, taskerId, token: token! } }),
    onSuccess: (r) => {
      if (r.ok) { toast.success("Tasker accepted"); refetch(); }
      else toast.error(r.error);
    },
  });

  const counterAmtNum = Number(counterAmt);
  const validCounter = counterAmtNum >= 100 && counterMsg.trim().length >= 5;
  const counterM = useMutation({
    mutationFn: () => {
      const toName = counterFor?.applicant_name ?? counterFor?.tasker_name ?? counterFor?.name ?? "tasker";
      return send({
        data: {
          taskId,
          token: token!,
          message_text: formatOfferMessage({ kind: "COUNTER", amount: counterAmtNum, toName, body: counterMsg.trim() }),
        },
      });
    },
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Counter sent");
        setCounterFor(null); setCounterMsg("");
        qaQ.refetch();
      } else toast.error(r.error);
    },
  });

  const declineM = useMutation({
    mutationFn: (offer: any) => {
      const toName = offer?.applicant_name ?? offer?.tasker_name ?? offer?.name ?? "tasker";
      return send({
        data: { taskId, token: token!, message_text: formatOfferMessage({ kind: "DECLINE", toName, body: "Sorry, going with someone else." }) },
      });
    },
    onSuccess: (r) => { if (r.ok) { toast.success("Offer declined"); qaQ.refetch(); } else toast.error(r.error); },
  });

  const askM = useMutation({
    mutationFn: () => send({ data: { taskId, message_text: question.trim(), token: token! } }),
    onSuccess: (r) => {
      if (r.ok) { setQuestion(""); qaQ.refetch(); toast.success("Question posted"); }
      else toast.error(r.error);
    },
  });

  const status = String(task?.status ?? "open").toLowerCase();
  const location = task?.location_text ?? task?.location;
  const remote = !!task?.is_remote;
  const date = task?.deadline ? new Date(task.deadline) : null;
  const dateLabel = date
    ? date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })
    : "Flexible";

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
    if (task && !offerAmt) setOfferAmt(String(task.budget ?? ""));
    setShowApply(true);
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
                <button className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  <Heart className="h-4 w-4" /> Follow
                </button>
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
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary font-bold">
                    {(task.poster_name ?? "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Posted by</dt>
                    <dd className="font-semibold text-ink">{task.poster_name ?? "Anonymous"}</dd>
                  </div>
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

              {/* Offers / Questions */}
              <section className="mt-8">
                <div className="inline-flex w-full sm:w-auto rounded-full bg-muted p-1">
                  <button
                    onClick={() => setTab("offers")}
                    className={
                      "flex-1 sm:flex-initial rounded-full px-6 py-2 text-sm font-bold transition " +
                      (tab === "offers" ? "bg-ink text-background" : "text-muted-foreground")
                    }
                  >
                    Offers <span className="ml-1 opacity-70">{offers.length}</span>
                  </button>
                  <button
                    onClick={() => setTab("questions")}
                    className={
                      "flex-1 sm:flex-initial rounded-full px-6 py-2 text-sm font-bold transition " +
                      (tab === "questions" ? "bg-ink text-background" : "text-muted-foreground")
                    }
                  >
                    Questions <span className="ml-1 opacity-70">{liveQuestions.length}</span>
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  {tab === "offers" ? (
                    offers.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
                        No offers yet. {!isPoster && token && status === "open" && (
                          <button onClick={openApplyModal} className="text-primary font-bold hover:underline">Be the first to make one →</button>
                        )}
                      </div>
                    ) : (
                      offers.map((o, i) => {
                        const oName = o.applicant_name ?? o.tasker_name ?? o.name ?? "Tasker";
                        const counters = allMessages.filter((m: any) => {
                          const body = m.message_text ?? m.message ?? m.body ?? "";
                          const tgt = parseCounterTarget(body);
                          return tgt && oName && tgt.toLowerCase().includes(String(oName).split(" ")[0].toLowerCase());
                        });
                        const declined = allMessages.some((m: any) => {
                          const body = m.message_text ?? m.message ?? m.body ?? "";
                          return isDecline(body) && (body || "").toLowerCase().includes(String(oName).split(" ")[0].toLowerCase());
                        });
                        return (
                          <OfferCard
                            key={i}
                            offer={o}
                            taskBudget={Number(task.budget ?? 0)}
                            isPoster={isPoster}
                            isMine={String(o.applicant_id ?? o.tasker_id ?? o.user_id) === String(myId)}
                            counters={counters}
                            declined={declined}
                            showAccept={isPoster && status === "open" && !declined}
                            onAccept={() => {
                              const tid = o.applicant_id ?? o.tasker_id ?? o.user_id;
                              if (tid != null) acceptM.mutate(tid);
                            }}
                            onCounter={() => {
                              setCounterFor(o);
                              setCounterAmt(String(parseOfferAmount(o.message) ?? task.budget ?? ""));
                              setCounterMsg("");
                            }}
                            onDecline={() => declineM.mutate(o)}
                            accepting={acceptM.isPending}
                          />
                        );
                      })
                    )
                  ) : (
                    <>
                      {token && !isPoster && (
                        <div className="rounded-2xl border border-border bg-card p-4">
                          <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            rows={3}
                            placeholder="Ask the poster a question…"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          />
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => askM.mutate()}
                              disabled={askM.isPending || question.trim().length < 3}
                              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                            >
                              {askM.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                              Post question
                            </button>
                          </div>
                        </div>
                      )}
                      {liveQuestions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">No questions yet.</div>
                      ) : (
                        liveQuestions.map((q, i) => <QuestionCard key={i} q={q} />)
                      )}
                    </>
                  )}
                </div>
              </section>

              <section className="mt-10 border-t border-border pt-6">
                <h3 className="font-display text-xl text-ink">Cancellation policy</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  If you are responsible for cancelling this task, a Cancellation Fee will be deducted from your next payment payout(s).
                </p>
                <Link to="/terms" className="mt-2 inline-block text-sm font-bold text-primary hover:underline">Learn more</Link>
              </section>
            </div>

            {/* RIGHT SIDEBAR — Budget card */}
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
                  </div>
                ) : !token ? (
                  <Link to="/login" search={{ redirect: `/tasks/${taskId}` } as any} className="mt-5 block w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90">
                    Log in to make an offer
                  </Link>
                ) : myApplication ? (
                  <Link to="/tasks/$taskId/workspace" params={{ taskId }} className="mt-5 block w-full rounded-full border border-primary text-primary py-3 text-sm font-bold hover:bg-primary/5">
                    Offer sent · Open conversation
                  </Link>
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
                  <button className="w-full text-left hover:text-primary">Save for later</button>
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
            <Link to="/tasks/$taskId/workspace" params={{ taskId }} className="block w-full text-center rounded-full border border-primary text-primary py-3 text-sm font-bold">
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
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your price (₦)</label>
              <input
                type="number"
                inputMode="numeric"
                min={100}
                value={offerAmt}
                onChange={(e) => setOfferAmt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-base font-semibold"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-muted-foreground">Task budget: ₦{Number(task?.budget ?? 0).toLocaleString()}</p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message to poster</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Hi! I've done similar tasks and can start right away. Here's how I'd approach it…"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                maxLength={2000}
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

      {/* Counter-offer modal */}
      <Dialog open={!!counterFor} onOpenChange={(o) => !o && setCounterFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-ink">Counter offer</DialogTitle>
            <DialogDescription>
              Propose a different price to {counterFor?.applicant_name ?? counterFor?.tasker_name ?? "the tasker"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Counter price (₦)</label>
              <input
                type="number"
                inputMode="numeric"
                min={100}
                value={counterAmt}
                onChange={(e) => setCounterAmt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-base font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</label>
              <textarea
                value={counterMsg}
                onChange={(e) => setCounterMsg(e.target.value)}
                rows={4}
                placeholder="I can offer this price if you can start sooner…"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                maxLength={1000}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <button onClick={() => setCounterFor(null)} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
              <XIcon className="h-4 w-4 inline -mt-0.5" /> Cancel
            </button>
            <button
              onClick={() => counterM.mutate()}
              disabled={!validCounter || counterM.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {counterM.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send counter
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OfferCard({
  offer, taskBudget, isPoster, isMine, counters, declined, showAccept, onAccept, onCounter, onDecline, accepting,
}: {
  offer: any; taskBudget: number; isPoster: boolean; isMine: boolean;
  counters: any[]; declined: boolean; showAccept: boolean;
  onAccept: () => void; onCounter: () => void; onDecline: () => void; accepting: boolean;
}) {
  const name = offer.applicant_name ?? offer.tasker_name ?? offer.user_name ?? offer.name ?? "Tasker";
  const rating = offer.rating ?? "5.0";
  const ratings = offer.ratings_count ?? offer.review_count ?? 0;
  const completion = offer.completion_rate ?? "100%";
  const rawMsg = offer.message ?? offer.comment ?? offer.body ?? "Hi! I'd love to help with this task.";
  const parsedAmt = parseOfferAmount(rawMsg);
  const cleanMsg = stripHeaders(rawMsg) || rawMsg;
  const time = offer.created_at ? new Date(offer.created_at).toLocaleDateString() : "Recently";
  const amount = Number(offer.amount ?? offer.price ?? parsedAmt ?? taskBudget);
  const [showReplies, setShowReplies] = useState(false);

  return (
    <article className={"rounded-2xl border bg-card p-5 " + (declined ? "border-destructive/30 opacity-70" : "border-border")}>
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-lg text-primary">
          {String(name).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-ink inline-flex items-center gap-1.5">
            {name} <BadgeCheck className="h-4 w-4 text-primary" />
            {isMine && <span className="ml-1 text-[10px] uppercase tracking-wider rounded-full bg-primary/10 text-primary px-2 py-0.5">You</span>}
            {declined && <span className="ml-1 text-[10px] uppercase tracking-wider rounded-full bg-destructive/10 text-destructive px-2 py-0.5">Declined</span>}
          </div>
          <div className="text-sm text-ink flex items-center gap-1.5 mt-0.5">
            <span className="font-bold">{rating}</span>
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span className="text-muted-foreground">({ratings})</span>
          </div>
          <div className="text-sm font-semibold text-ink mt-0.5">{completion} Completion rate</div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-xl text-ink">₦{amount.toLocaleString()}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Offer</div>
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-muted/60 p-4 text-sm text-ink whitespace-pre-wrap">{cleanMsg}</div>

      {counters.length > 0 && (
        <div className="mt-3 space-y-2">
          {counters.map((c, i) => {
            const body = c.message_text ?? c.message ?? c.body ?? "";
            const cAmt = parseOfferAmount(body);
            return (
              <div key={i} className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Counter offer</span>
                  {cAmt != null && <span className="font-display text-lg text-ink">₦{cAmt.toLocaleString()}</span>}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-foreground/90">{stripHeaders(body)}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <button onClick={() => setShowReplies((v) => !v)} className="inline-flex items-center gap-1 text-primary font-semibold hover:underline">
          <MessageSquare className="h-3.5 w-3.5" /> {showReplies ? "Hide" : "View"} replies ({counters.length})
        </button>
        <span className="text-muted-foreground">· {time}</span>
        <div className="flex items-center gap-2 ml-auto">
          {isPoster && !declined && (
            <>
              <button onClick={onDecline} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">Decline</button>
              <button onClick={onCounter} className="rounded-full border border-primary text-primary px-3 py-1.5 text-xs font-semibold hover:bg-primary/5">Counter</button>
            </>
          )}
          {showAccept && (
            <button
              onClick={onAccept}
              disabled={accepting}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {accepting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Accept
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function QuestionCard({ q }: { q: any }) {
  const name = q.sender_name ?? q.user_name ?? q.name ?? "User";
  const body = q.message_text ?? q.message ?? q.body ?? q.text ?? "";
  const time = q.created_at ? new Date(q.created_at).toLocaleString() : "Recently";
  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary font-bold text-sm">
          {String(name).charAt(0).toUpperCase()}
        </div>
        <div className="font-semibold text-ink text-sm">{name}</div>
        <div className="text-xs text-muted-foreground ml-auto">{time}</div>
      </div>
      <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap">{body}</p>
    </article>
  );
}
