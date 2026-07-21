import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, ArrowLeft, Send, CheckCircle2, AlertTriangle, Star, Banknote, Lock, MapPin, Navigation, Flag } from "lucide-react";
import { toast } from "sonner";
import { TaskHeader } from "@/components/TaskHeader";
import { useAuth } from "@/lib/auth";
import { LiveTaskMap } from "@/components/LiveTaskMap";
import {
  getTask, listMessages, sendMessage, completeTask, disputeTask, rateTask,
  releaseTask,
  getTaskLocation, toggleTaskLocation, markArrived,
} from "@/lib/findtask.functions";


export const Route = createFileRoute("/tasks/$taskId/workspace")({
  head: () => ({ meta: [{ title: "Task workspace — Find-task" }] }),
  component: WorkspacePage,
});

function extractMsgs(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.messages ?? d.results ?? d.data ?? [];
}

function WorkspacePage() {
  const { taskId } = Route.useParams();
  const { token, ready, user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready && !token) navigate({ to: "/login", search: { redirect: `/tasks/${taskId}/workspace` } as any });
  }, [token, taskId, navigate]);

  const tFn = useServerFn(getTask);
  const mFn = useServerFn(listMessages);
  const sFn = useServerFn(sendMessage);
  const cFn = useServerFn(completeTask);
  const relFn = useServerFn(releaseTask);
  const dFn = useServerFn(disputeTask);
  const rFn = useServerFn(rateTask);

  const taskQ = useQuery({ queryKey: ["task", taskId], queryFn: () => tFn({ data: { taskId } }) });
  const msgsQ = useQuery({
    queryKey: ["task", taskId, "messages", token],
    enabled: !!token,
    queryFn: () => mFn({ data: { taskId, token: token! } }),
    refetchInterval: 8000,
  });

  const [draft, setDraft] = useState("");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const task: any = taskQ.data?.ok ? ((taskQ.data.data as any)?.task ?? taskQ.data.data) : null;
  const rawMessages = msgsQ.data?.ok ? extractMsgs(msgsQ.data.data) : [];
  const myId = (user as any)?.user_id ?? (user as any)?.id;
  const posterId = task?.poster_id ?? task?.user_id ?? task?.owner_id;
  const taskerId = task?.tasker_id ?? task?.accepted_tasker_id ?? task?.assigned_to;

  const sendM = useMutation({
    mutationFn: async () =>
      sFn({ data: { taskId, message_text: draft.trim(), token: token! } }),
    onSuccess: (r) => {
      if (r.ok) { setDraft(""); msgsQ.refetch(); } else toast.error(r.error);
    },
  });
  const completeM = useMutation({
    mutationFn: () => cFn({ data: { taskId, token: token! } }),
    onSuccess: (r) => r.ok
      ? (toast.success("Marked complete. Poster has been notified to release payment."), taskQ.refetch())
      : toast.error(r.error),
  });
  const releaseM = useMutation({
    mutationFn: () => relFn({ data: { taskId, token: token! } }),
    onSuccess: (r) => r.ok
      ? (toast.success("Payment released to the tasker."), setShowRate(true), taskQ.refetch())
      : toast.error(r.error),
  });
  const disputeM = useMutation({
    mutationFn: () => dFn({ data: { taskId, reason: disputeReason.trim(), token: token! } }),
    onSuccess: (r) => r.ok ? (toast.success("Dispute filed."), setShowDispute(false), taskQ.refetch()) : toast.error(r.error),
  });
  const rateM = useMutation({
    mutationFn: () => rFn({ data: { taskId, rating, review_text: review.trim() || undefined, token: token! } }),
    onSuccess: (r) => r.ok ? (toast.success("Rating submitted."), setShowRate(false)) : toast.error(r.error),
  });

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [msgsQ.data]);

  if (!token) return null;
  const status = String(task?.status ?? "").toLowerCase();
  const isPoster = posterId !== undefined && String(posterId) === String(myId);
  const isTasker = taskerId !== undefined && String(taskerId) === String(myId);
  const AWAITING = ["completed_by_tasker", "pending_release", "awaiting_release", "work_submitted", "submitted"];
  const COMPLETED = ["completed", "released", "paid_out", "paid"];
  const IN_PROGRESS = ["assigned", "accepted", "in_progress", "active"];
  const awaitingRelease = AWAITING.includes(status) || Boolean(task?.tasker_marked_complete);
  const isCompleted = COMPLETED.includes(status);
  const inProgress = IN_PROGRESS.includes(status);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 flex-1 grid gap-6 md:grid-cols-[1fr_300px]">
        <section className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden h-[70vh]">
          <header className="border-b border-border p-4 flex items-center justify-between">
            <Link to="/tasks/$taskId" params={{ taskId }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> {task?.title ?? "Task"}
            </Link>
            <div className="flex items-center gap-2">
              {status && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">{status}</span>
              )}
            </div>
          </header>

          <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/30">
            {msgsQ.isFetching && rawMessages.length === 0 ? (
              <div className="text-sm text-muted-foreground inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>
            ) : rawMessages.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-10">Say hello to start the conversation.</div>
            ) : rawMessages.map((m: any, i: number) => {
              const senderId = m.sender_id ?? m.user_id ?? m.from;
              const mine = senderId !== undefined && String(senderId) === String(myId);
              const text = m.message_text ?? m.body ?? m.message ?? m.text ?? "";
              return (
                <div key={m.message_id ?? m.id ?? i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-background border border-border"}`}>
                    <div className="whitespace-pre-wrap break-words">{text}</div>
                    {m.created_at && <div className={`mt-0.5 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); if (draft.trim()) sendM.mutate(); }}
            className="border-t border-border p-3 flex items-center gap-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
            <button type="submit" disabled={!draft.trim() || sendM.isPending} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {sendM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
            </button>
          </form>
        </section>

        <aside className="space-y-4">
          {task && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs text-muted-foreground">Budget (escrow)</div>
              <div className="mt-1 flex items-center gap-2 text-2xl font-bold">
                <Banknote className="h-5 w-5 text-primary" /> ₦{Number(task.budget ?? 0).toLocaleString()}
              </div>
              {(task.location_text ?? task.location) && (
                <div className="mt-3 text-sm text-muted-foreground">{task.location_text ?? task.location}</div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <h3 className="font-semibold">Actions</h3>

            {isTasker && inProgress && !awaitingRelease && (
              <button onClick={() => completeM.mutate()} disabled={completeM.isPending} className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {completeM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Mark task as complete
              </button>
            )}

            {isTasker && awaitingRelease && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                You've marked this task complete. Awaiting the poster to release payment.
              </div>
            )}

            {isPoster && awaitingRelease && (
              <>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-foreground/80">
                  The tasker has marked this task complete. Review the work, then release payment to finish.
                </div>
                <button onClick={() => releaseM.mutate()} disabled={releaseM.isPending} className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  {releaseM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />} Release payment
                </button>
              </>
            )}

            {isCompleted && (
              <button onClick={() => setShowRate(true)} className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
                <Star className="h-4 w-4" /> Leave a rating
              </button>
            )}
            <button onClick={() => setShowDispute((s) => !s)} className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-destructive/40 text-destructive px-4 py-2 text-sm font-semibold hover:bg-destructive/10">
              <AlertTriangle className="h-4 w-4" /> Raise a dispute
            </button>

            {showDispute && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={3}
                  placeholder="Describe the issue…"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  onClick={() => disputeReason.trim().length >= 5 && disputeM.mutate()}
                  disabled={disputeM.isPending || disputeReason.trim().length < 5}
                  className="w-full rounded-full bg-destructive text-destructive-foreground px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Submit dispute
                </button>
              </div>
            )}
          </div>

          {showRate && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h3 className="font-semibold">Rate this task</h3>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                    <Star className={`h-7 w-7 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                placeholder="Share your experience (optional)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                onClick={() => rateM.mutate()}
                disabled={rateM.isPending}
                className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {rateM.isPending ? "Submitting…" : "Submit rating"}
              </button>
            </div>
          )}

          {task && !task.is_remote && (status === "assigned" || status === "in_progress" || status === "accepted") && (
            <LiveLocationPanel
              taskId={taskId}
              token={token!}
              isPoster={isPoster}
              taskLat={task?.location_lat ?? task?.latitude}
              taskLng={task?.location_lng ?? task?.longitude}
            />
          )}
        </aside>
      </main>
    </div>
  );
}

function LiveLocationPanel({ taskId, token, isPoster, taskLat, taskLng }: { taskId: string; token: string; isPoster: boolean; taskLat?: number | null; taskLng?: number | null }) {
  const getLoc = useServerFn(getTaskLocation);
  const toggle = useServerFn(toggleTaskLocation);
  const arrive = useServerFn(markArrived);

  const locQ = useQuery({
    queryKey: ["task", taskId, "location", token],
    queryFn: () => getLoc({ data: { taskId, token } }),
    refetchInterval: 15000,
  });

  const [sharing, setSharing] = useState(false);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const watchRef = useRef<number | null>(null);
  const [liveTrail, setLiveTrail] = useState<[number, number][]>([]);

  // Start/stop browser geolocation watch when sharing is on.
  useEffect(() => {
    if (!sharing) {
      if (watchRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      return;
    }
    if (!navigator.geolocation) {
      toast.error("Geolocation isn't supported on this device.");
      setSharing(false);
      return;
    }
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => {
        const next = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(next);
        toggle({ data: { taskId, token, sharing: true, latitude: next.lat, longitude: next.lng } }).catch(() => {});
      },
      () => toast.error("Couldn't get your location."),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
    return () => {
      if (watchRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [sharing, taskId, token, toggle]);

  const data: any = locQ.data?.ok ? locQ.data.data : null;
  const locErr: string = !locQ.data?.ok ? String((locQ.data as any)?.error ?? "") : "";
  const inactiveNotice = /only.*active.*(ongoing|assigned|in.progress)|not.*active|no active|inactive/i.test(locErr)
    ? "Live location is only active while this task is in progress."
    : "";
  const poster = data?.poster ?? data?.poster_location;
  const tasker = data?.tasker ?? data?.tasker_location;
  const other = isPoster ? tasker : poster;

  const onToggle = async () => {
    const next = !sharing;
    setSharing(next);
    if (!next) {
      await toggle({ data: { taskId, token, sharing: false } }).catch(() => {});
    }
  };

  const onArrived = async () => {
    const here = pos;
    const r: any = await arrive({ data: { taskId, token, ...(here ? { latitude: here.lat, longitude: here.lng } : {}) } });
    if (r?.ok) toast.success("Marked arrived"); else toast.error(r?.error ?? "Could not mark arrived");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <h3 className="font-semibold inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Live location</h3>
      <p className="text-xs text-muted-foreground">On-site task — share your live location with the {isPoster ? "tasker" : "poster"} to coordinate arrival.</p>

      <button
        onClick={onToggle}
        className={`w-full inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${sharing ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground hover:opacity-90"}`}
      >
        <Navigation className="h-4 w-4" /> {sharing ? "Sharing live · Tap to stop" : "Share my location"}
      </button>

      {inactiveNotice && (
        <div className="rounded-xl border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground">{inactiveNotice}</div>
      )}

      {pos && (
        <div className="text-[11px] text-muted-foreground">You: {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}</div>
      )}

      {other && (other.latitude ?? other.lat) != null && (
        <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs">
          <div className="font-semibold text-ink">{isPoster ? "Tasker" : "Poster"} location</div>
          <div className="text-muted-foreground mt-0.5">
            {(other.latitude ?? other.lat)?.toFixed?.(4)}, {(other.longitude ?? other.lng)?.toFixed?.(4)}
          </div>
          <a
            href={`https://www.google.com/maps?q=${other.latitude ?? other.lat},${other.longitude ?? other.lng}`}
            target="_blank" rel="noopener noreferrer"
            className="mt-1 inline-block text-primary font-semibold hover:underline"
          >
            Open in Google Maps →
          </a>
        </div>
      )}

      {!isPoster && (
        <button
          onClick={onArrived}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
        >
          <Flag className="h-4 w-4" /> I've arrived
        </button>
      )}
    </div>
  );
}

