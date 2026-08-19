import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, ArrowLeft, Send, CheckCircle2, AlertTriangle, Star, Banknote, MapPin, Navigation, Flag, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { TaskHeader } from "@/components/TaskHeader";
import { useAuth } from "@/lib/auth";
import { LiveTaskMap } from "@/components/LiveTaskMap";
import {
  getTask, listMessages, sendMessage, completeTask, disputeTask, rateTask,
  releaseTask, getMyRating,
  getTaskLocation, toggleTaskLocation, markArrived, recordLocation,
} from "@/lib/findtask.functions";
import { uploadTaskMedia } from "@/lib/media.functions";
import { submitSupportTicket } from "@/lib/support.functions";
import { MilestoneActions } from "@/components/MilestoneActions";


export const Route = createFileRoute("/tasks/$taskId/workspace")({
  validateSearch: (s: Record<string, unknown> = {}) => ({
    with: typeof s.with === "string" ? s.with : undefined,
    dispute:
      s.dispute === 1 || s.dispute === "1" || s.dispute === true ? 1 : (undefined as 1 | undefined),
  }),
  head: () => ({ meta: [{ title: "Task workspace — Find-task" }] }),
  component: WorkspacePage,
});

function extractMsgs(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.messages ?? d.results ?? d.data ?? [];
}

const IMAGE_RE = /\.(png|jpe?g|gif|webp|avif|heic)(\?|$)/i;
const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i;

function Attachment({ url }: { url: string }) {
  if (VIDEO_RE.test(url)) {
    return <video src={url} controls className="mt-1 max-h-64 w-full rounded-xl bg-black/40" />;
  }
  if (IMAGE_RE.test(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt="Attachment shared in this task conversation" loading="lazy" className="mt-1 max-h-64 rounded-xl object-cover" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-xs underline">
      <Paperclip className="h-3.5 w-3.5" /> View attachment
    </a>
  );
}

function WorkspacePage() {
  const { taskId } = Route.useParams();
  const { with: withTasker, dispute: disputeFlag } = Route.useSearch();
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
  const myRatingFn = useServerFn(getMyRating);
  const uploadFn = useServerFn(uploadTaskMedia);
  const notifyAdminFn = useServerFn(submitSupportTicket);

  const taskQ = useQuery({ queryKey: ["task", taskId], queryFn: () => tFn({ data: { taskId } }) });
  const msgsQ = useQuery({
    queryKey: ["task", taskId, "messages", token, withTasker ?? ""],
    enabled: !!token,
    queryFn: () => mFn({ data: { taskId, taskerId: withTasker, token: token! } }),
    refetchInterval: 8000,
  });

  const [draft, setDraft] = useState("");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [showDispute, setShowDispute] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const task: any = taskQ.data?.ok ? ((taskQ.data.data as any)?.task ?? taskQ.data.data) : null;
  const rawMessages = msgsQ.data?.ok ? extractMsgs(msgsQ.data.data) : [];
  const myId = (user as any)?.user_id ?? (user as any)?.id;
  const posterId = task?.poster_id ?? task?.user_id ?? task?.owner_id;
  const taskerId =
    task?.tasker_id ?? task?.accepted_tasker_id ?? task?.assigned_to ??
    task?.assigned_tasker_id ?? task?.accepted_user_id ??
    task?.tasker?.user_id ?? task?.tasker?.id ?? task?.assignee_id ??
    task?.accepted_offer?.user_id ?? task?.accepted_offer?.tasker_id;

  const messagingClosed = useMemo(() => {
    const released = task?.payment_released === 1 || task?.payment_released === true;
    if (!released || !task?.payment_released_at) return false;
    if (String(task?.status).toLowerCase() === "disputed") return false; // open dispute keeps it open
    const releasedAt = new Date(task.payment_released_at).getTime();
    const hoursSince = (Date.now() - releasedAt) / 3_600_000;
    return hoursSince >= 48;
  }, [task]);

  // Arriving from the task page's "Open dispute" button opens the form directly.
  useEffect(() => {
    if (disputeFlag === 1) setShowDispute(true);
  }, [disputeFlag]);

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result ?? ""));
      fr.onerror = () => reject(new Error("Could not read the file"));
      fr.readAsDataURL(file);
    });

  const sendM = useMutation({
    mutationFn: async () => {
      let attachment_url: string | undefined;
      if (pendingFile) {
        setUploading(true);
        try {
          const dataBase64 = await readFileAsBase64(pendingFile);
          const up: any = await uploadFn({
            data: {
              taskId,
              token: token!,
              filename: pendingFile.name,
              contentType: pendingFile.type || "image/jpeg",
              dataBase64,
            },
          });
          if (!up?.ok) throw new Error(up?.error ?? "Upload failed");
          attachment_url = up.url as string;
        } finally {
          setUploading(false);
        }
      }
      const text = draft.trim() || (attachment_url ? "📎 Attachment" : "");
      return sFn({ data: { taskId, message_text: text, attachment_url, recipient_id: withTasker, token: token! } });
    },
    onSuccess: (r) => {
      if (r.ok) {
        setDraft("");
        setPendingFile(null);
        if (fileRef.current) fileRef.current.value = "";
        msgsQ.refetch();
      } else toast.error(r.error);
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not send message"),
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
    mutationFn: async () => {
      const r: any = await dFn({ data: { taskId, reason: disputeReason.trim(), token: token! } });
      if (r?.ok) {
        // Raise an admin ticket so moderators can review the poster/tasker chat.
        await notifyAdminFn({
          data: {
            name: String((user as any)?.name ?? (user as any)?.full_name ?? "Find-am user"),
            email: String((user as any)?.email ?? "no-reply@find-am.com"),
            subject: `Dispute on task #${taskId}: ${task?.title ?? "task"}`,
            message:
              `A dispute was raised on task #${taskId} (${task?.title ?? "untitled"}).\n\n` +
              `Reason: ${disputeReason.trim()}\n\n` +
              `Review the conversation at /tasks/${taskId}/workspace`,
            category: "dispute" as const,
            user_ref: String(myId ?? ""),
          },
        }).catch(() => {});
      }
      return r;
    },
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Dispute filed. Our team has been notified and will review the chat.");
        setShowDispute(false);
        setDisputeReason("");
        setDisputeError(null);
        taskQ.refetch();
        return;
      }
      const msg = String(r.error ?? "Couldn't file this dispute.");
      setDisputeError(
        /resolved|already/i.test(msg)
          ? "This task's dispute has already been reviewed and resolved by Find-am support, so it can't be reopened. If something is still wrong, contact support and reference this task."
          : msg,
      );
      toast.error(msg);
    },
  });
  const task_forRating: any = taskQ.data?.ok ? ((taskQ.data.data as any)?.task ?? taskQ.data.data) : null;
  const _isCompletedForRating =
    String(task_forRating?.status ?? "").toLowerCase() === "completed" &&
    Boolean(task_forRating?.payment_released);
  const myRatingQ = useQuery({
    queryKey: ["task", taskId, "my-rating", token],
    enabled: !!token && _isCompletedForRating,
    queryFn: () => myRatingFn({ data: { taskId, token: token! } }),
  });
  const rateM = useMutation({
    mutationFn: () => rFn({ data: { taskId, rating, review_text: review.trim() || undefined, token: token! } }),
    onSuccess: (r) => {
      if (r.ok) { toast.success("Rating submitted."); setShowRate(false); myRatingQ.refetch(); }
      else toast.error(r.error);
    },
  });

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [msgsQ.data]);

  if (!token) return null;
  const status = String(task?.status ?? "").toLowerCase();
  const isPoster = posterId !== undefined && String(posterId) === String(myId);
  const isTasker = taskerId !== undefined && String(taskerId) === String(myId);
  const IN_PROGRESS = ["assigned", "accepted", "in_progress", "active"];
  const paymentReleased = Boolean(task?.payment_released);
  const awaitingRelease = status === "completed" && !paymentReleased;
  const isCompleted = status === "completed" && paymentReleased;
  const inProgress = IN_PROGRESS.includes(status);
  const isTaskerFinal = isTasker || String(task?.my_offer?.status ?? "").toLowerCase() === "accepted";
  const hasRated = myRatingQ.data?.ok ? Boolean((myRatingQ.data.data as any)?.has_rated) : false;

  // If task hasn't been assigned yet, or the viewer is neither poster nor the assigned tasker,
  // send them back to the task page where the offer/messages threads live.
  useEffect(() => {
    if (!ready || !token || !task) return;
    const assigned = inProgress || awaitingRelease || isCompleted;
    if (!assigned || (!isPoster && !isTaskerFinal)) {
      navigate({ to: "/tasks/$taskId", params: { taskId }, replace: true });
    }
  }, [ready, token, task, inProgress, awaitingRelease, isCompleted, isPoster, isTaskerFinal, taskId, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 flex-1 grid gap-6 md:grid-cols-[1fr_300px]">
        <section className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden h-[70vh]">
          <header className="border-b border-border p-4 flex items-center justify-between">
            <Link to="/messages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
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
              const isSystem = m.is_system === 1 || m.is_system === true;
              const text = m.message_text ?? m.body ?? m.message ?? m.text ?? "";
              const attachment = m.attachment_url ?? m.attachment ?? m.media_url ?? null;

              // System/opener messages render as a neutral centered pill, not attributed to anyone.
              if (isSystem) {
                return (
                  <div key={m.message_id ?? m.id ?? i} className="flex justify-center my-1">
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground text-center max-w-[85%]">
                      {text}
                    </span>
                  </div>
                );
              }

              const senderId = m.sender_id ?? m.user_id ?? m.from;
              const mine = senderId !== undefined && String(senderId) === String(myId);
              return (
                <div key={m.message_id ?? m.id ?? i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-background border border-border"}`}>
                    <div className="whitespace-pre-wrap break-words">{text}</div>
                    {attachment && <Attachment url={String(attachment)} />}
                    {m.created_at && <div className={`mt-0.5 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {messagingClosed ? (
            <div className="border-t border-border p-3 text-center text-sm text-muted-foreground">
              This conversation is closed.
            </div>
          ) : (
            <div className="border-t border-border">
              {pendingFile && (
                <div className="flex items-center gap-2 px-3 pt-3 text-xs text-muted-foreground">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[60%]">{pendingFile.name}</span>
                  <button type="button" onClick={() => { setPendingFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <form
                onSubmit={(e) => { e.preventDefault(); if (draft.trim() || pendingFile) sendM.mutate(); }}
                className="p-3 flex items-center gap-2"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (f && f.size > 25 * 1024 * 1024) { toast.error("Please choose a file under 25MB."); return; }
                    setPendingFile(f);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Attach a photo or video"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                />
                <button type="submit" disabled={(!draft.trim() && !pendingFile) || sendM.isPending} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  {sendM.isPending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
                </button>
              </form>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          {task && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs text-muted-foreground">Budget (held)</div>
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

            {task?.is_milestone ? (
              <MilestoneActions
                taskId={taskId}
                token={token!}
                isPoster={isPoster}
                isTasker={isTaskerFinal}
                milestones={task?.milestones ?? []}
                onChanged={() => taskQ.refetch()}
              />
            ) : (
              <>
                {isTaskerFinal && inProgress && !awaitingRelease && !isCompleted && (
                  <button onClick={() => completeM.mutate()} disabled={completeM.isPending} className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                    {completeM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Mark task as complete
                  </button>
                )}

                {isTaskerFinal && awaitingRelease && !isCompleted && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                    You've marked this task complete. Awaiting the poster to release payment.
                  </div>
                )}

                {isPoster && awaitingRelease && !isCompleted && (
                  <>
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-foreground/80">
                      The tasker has marked this task complete. Review the work, then release payment to finish.
                    </div>
                    <button onClick={() => releaseM.mutate()} disabled={releaseM.isPending} className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                      {releaseM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />} Release payment
                    </button>
                  </>
                )}
              </>
            )}

            {isCompleted && !hasRated && (
              <button onClick={() => setShowRate(true)} className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
                <Star className="h-4 w-4" /> Leave a rating
              </button>
            )}
            {isCompleted && hasRated && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-700 text-center font-medium">
                Rating submitted ✓
              </div>
            )}
            {!messagingClosed && (
              <button onClick={() => setShowDispute((s) => !s)} className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-destructive/40 text-destructive px-4 py-2 text-sm font-semibold hover:bg-destructive/10">
                <AlertTriangle className="h-4 w-4" /> Raise a dispute
              </button>
            )}

            {showDispute && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={3}
                  placeholder="Describe the issue…"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                {disputeError && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">{disputeError}</p>
                )}
                <button
                  onClick={() => { setDisputeError(null); if (disputeReason.trim().length >= 5) disputeM.mutate(); }}
                  disabled={disputeM.isPending || disputeReason.trim().length < 5 || !!disputeError}
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
              arrivedAt={task?.arrived_at ?? null}
              onRefetchTask={() => taskQ.refetch()}
            />
          )}
        </aside>
      </main>
    </div>
  );
}

/** Metres between two lat/lng points (haversine). */
function metresBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function LiveLocationPanel({ taskId, token, isPoster, taskLat, taskLng, arrivedAt, onRefetchTask }: { taskId: string; token: string; isPoster: boolean; taskLat?: number | null; taskLng?: number | null; arrivedAt?: string | null; onRefetchTask?: () => void }) {
  const getLoc = useServerFn(getTaskLocation);
  const toggle = useServerFn(toggleTaskLocation);
  const recordLoc = useServerFn(recordLocation);
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
  const [arriveError, setArriveError] = useState<string | null>(null);
  const [arriving, setArriving] = useState(false);

  /** One-shot high-accuracy fix, used by "I've arrived" when we have no live watch. */
  const getFix = () =>
    new Promise<{ lat: number; lng: number } | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
      );
    });

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
        setLiveTrail((t) => [...t, [next.lat, next.lng]]);
        recordLoc({ data: { taskId, token, latitude: next.lat, longitude: next.lng } }).catch(() => {});
      },
      () => toast.error("Couldn't get your location."),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
    return () => {
      if (watchRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [sharing, taskId, token, recordLoc]);

  const data: any = locQ.data?.ok ? locQ.data.data : null;
  const locErr: string = !locQ.data?.ok ? String((locQ.data as any)?.error ?? "") : "";
  const inactiveNotice = /only.*active.*(ongoing|assigned|in.progress)|not.*active|no active|inactive/i.test(locErr)
    ? "Live location is only active while this task is in progress."
    : "";
  const other = data?.other ?? null;

  useEffect(() => {
    const mySharing = data?.me?.sharing;
    if (typeof mySharing === "boolean") {
      setSharing(mySharing);
    }
  }, [data?.me?.sharing]);

  const onToggle = async () => {
    const next = !sharing;
    setSharing(next);
    if (!next) {
      await toggle({ data: { taskId, token, sharing: false } }).catch(() => {});
    }
  };

  const onArrived = async () => {
    setArriveError(null);
    setArriving(true);
    const fix = pos ?? (await getFix());
    if (!fix) {
      setArriving(false);
      setArriveError("We couldn't read your location. Turn on location access for this site, then tap “Re-check my location”.");
      return;
    }
    setPos(fix);
    const away = taskLat != null && taskLng != null ? metresBetween(fix, { lat: Number(taskLat), lng: Number(taskLng) }) : null;
    try {
      const r: any = await arrive({ data: { taskId, token, latitude: fix.lat, longitude: fix.lng } });
      setArriving(false);
      if (r?.ok) {
        toast.success("Marked arrived — the poster has been notified.");
        onRefetchTask?.();
        return;
      }
      const msg = String(r?.error ?? "Couldn't mark arrival.");
      if (/far|distance|away|not at|location/i.test(msg) && away != null) {
        setArriveError(
          `You're about ${away >= 1000 ? `${(away / 1000).toFixed(1)} km` : `${Math.round(away)} m`} from the task location, so arrival can't be confirmed yet. Get closer to the pin and tap “Re-check my location”.`,
        );
      } else {
        setArriveError(msg);
      }
      toast.error(msg);
    } catch (e: any) {
      setArriving(false);
      setArriveError(e?.message ?? "Couldn't mark arrival. Please try again.");
    }
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

      <LiveTaskMap
        taskLat={taskLat ?? null}
        taskLng={taskLng ?? null}
        me={data?.me ?? data?.self ?? null}
        other={other ?? null}
        liveTrail={liveTrail}
        isPoster={isPoster}
      />

      {!isPoster && !arrivedAt && (
        <div className="space-y-2">
          <button
            onClick={onArrived}
            disabled={arriving}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            {arriving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
            {arriving ? "Checking your location…" : "I've arrived"}
          </button>
          {arriveError && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
              <p className="text-xs text-amber-700 dark:text-amber-400">{arriveError}</p>
              <button
                onClick={onArrived}
                disabled={arriving}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 disabled:opacity-50"
              >
                <Navigation className="h-3.5 w-3.5" /> Re-check my location
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
