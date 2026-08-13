import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Loader2, ArrowLeft, Send, ShieldCheck, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { TaskHeader } from "@/components/TaskHeader";
import { useAuth } from "@/lib/auth";
import { getDisputeMessages, sendDisputeMessage } from "@/lib/findtask.functions";
import { uploadTaskMedia } from "@/lib/media.functions";

export const Route = createFileRoute("/disputes/$disputeId")({
  head: () => ({
    meta: [
      { title: "Dispute room — Find-task" },
      { name: "description", content: "Private support room for a task dispute on Find-task." },
      { property: "og:title", content: "Dispute room — Find-task" },
      { property: "og:description", content: "Private support room for a task dispute on Find-task." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DisputeRoomPage,
});

const IMAGE_RE = /\.(png|jpe?g|gif|webp|avif|heic)(\?|$)/i;
const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i;

function Attachment({ url }: { url: string }) {
  if (VIDEO_RE.test(url)) return <video src={url} controls className="mt-1 max-h-64 w-full rounded-xl bg-black/40" />;
  if (IMAGE_RE.test(url))
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt="Evidence shared in this dispute room" loading="lazy" className="mt-1 max-h-64 rounded-xl object-cover" />
      </a>
    );
  return (
    <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-xs underline">
      <Paperclip className="h-3.5 w-3.5" /> View attachment
    </a>
  );
}

function DisputeRoomPage() {
  const { disputeId } = Route.useParams();
  const { token, ready } = useAuth();
  const navigate = useNavigate();
  const getFn = useServerFn(getDisputeMessages);
  const sendFn = useServerFn(sendDisputeMessage);
  const uploadFn = useServerFn(uploadTaskMedia);

  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ready && !token) navigate({ to: "/login", search: { redirect: `/disputes/${disputeId}` } as any });
  }, [ready, token, navigate, disputeId]);

  const roomQ = useQuery({
    queryKey: ["dispute-room", disputeId, token],
    enabled: !!token,
    queryFn: () => getFn({ data: { disputeId, token: token! } }),
    refetchInterval: 12_000,
  });

  const room: any = roomQ.data?.ok ? roomQ.data.data : null;
  const messages: any[] = room?.messages ?? [];
  const closed = !!room?.closed;
  const notVisible = roomQ.data && !roomQ.data.ok && (roomQ.data as any).status === 404;

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [messages.length]);

  const readAsBase64 = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result ?? ""));
      fr.onerror = () => reject(new Error("Could not read the file"));
      fr.readAsDataURL(f);
    });

  const sendM = useMutation({
    mutationFn: async () => {
      let attachment_url: string | undefined;
      if (file && room?.task_id) {
        setUploading(true);
        try {
          const dataBase64 = await readAsBase64(file);
          const up: any = await uploadFn({
            data: {
              taskId: String(room.task_id),
              token: token!,
              filename: file.name,
              contentType: file.type || "image/jpeg",
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
      return sendFn({ data: { disputeId, message_text: text, attachment_url, token: token! } });
    },
    onSuccess: (r: any) => {
      if (r?.ok) {
        setDraft("");
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
        roomQ.refetch();
      } else {
        toast.error(r?.error ?? "Could not send message");
        roomQ.refetch();
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not send message"),
  });

  if (!token) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TaskHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-0 sm:px-4 py-0 sm:py-6">
        <div className="bg-card sm:rounded-2xl sm:border sm:border-border overflow-hidden">
          <div className="border-b border-border bg-amber-500/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Link to="/messages" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h1 className="font-semibold text-ink truncate">
                Dispute #{disputeId}
                {room?.task_title ? ` · ${room.task_title}` : ""}
              </h1>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-amber-800 dark:text-amber-200">
              Find-am support is reviewing this dispute and is speaking with both parties <strong>separately</strong>. The other party cannot
              see this room or anything you write here.
            </p>
          </div>

          <div ref={scrollerRef} className="max-h-[60vh] min-h-[280px] overflow-y-auto p-4 space-y-2">
            {roomQ.isPending ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading room…
              </div>
            ) : notVisible || !room ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Support hasn't opened this dispute room yet. You'll be notified as soon as our team reaches out about this task.
              </div>
            ) : messages.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No messages in this room yet.</div>
            ) : (
              messages.map((m: any) => {
                const admin = m.sender_is_admin === 1 || m.sender_is_admin === true;
                return (
                  <div
                    key={String(m.message_id ?? m.id)}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      admin ? "bg-amber-500/15 border border-amber-500/30" : "ml-auto bg-primary text-primary-foreground"
                    }`}
                  >
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${admin ? "text-amber-700 dark:text-amber-300" : "text-primary-foreground/80"}`}>
                      {admin ? "Find-am support" : "You"}
                    </div>
                    <div className="mt-0.5 whitespace-pre-wrap">{m.message_text}</div>
                    {m.attachment_url && <Attachment url={m.attachment_url} />}
                    <div className={`mt-1 text-[10px] ${admin ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                      {m.created_at ? new Date(m.created_at).toLocaleString() : ""}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {closed ? (
            <div className="border-t border-border px-4 py-4 text-center text-sm text-muted-foreground">
              This dispute has been resolved. The room is read-only.
            </div>
          ) : room ? (
            <div className="border-t border-border p-3">
              {file && (
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Paperclip className="h-3.5 w-3.5" /> {file.name}
                  <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted"
                  aria-label="Attach evidence"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={1}
                  placeholder="Reply to support…"
                  className="flex-1 resize-none rounded-2xl border border-border bg-background px-3 py-2.5 text-sm"
                />
                <button
                  disabled={sendM.isPending || uploading || (!draft.trim() && !file)}
                  onClick={() => sendM.mutate()}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                  aria-label="Send message"
                >
                  {sendM.isPending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
