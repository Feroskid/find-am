import { useRef, useState } from "react";
import { Camera, Link2, Loader2, X } from "lucide-react";

/**
 * Avatar control — supports either:
 *  - Direct image URL paste
 *  - Local file upload converted to a data URL (kept inline; works without a storage bucket)
 *
 * Calls `onChange(url)` whenever the value changes.
 */
export function AvatarUpload({
  value,
  name,
  onChange,
}: {
  value: string;
  name?: string;
  onChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value || "");

  const pickFile = () => fileRef.current?.click();
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1.5 * 1024 * 1024) {
      alert("Please pick an image under 1.5MB.");
      return;
    }
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result ?? ""));
      setBusy(false);
    };
    reader.onerror = () => setBusy(false);
    reader.readAsDataURL(f);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {value ? (
          <img src={value} alt="" className="h-20 w-20 rounded-full object-cover border border-border" />
        ) : (
          <div className="h-20 w-20 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center text-2xl font-bold border border-border">
            {(name || "U").charAt(0).toUpperCase()}
          </div>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-1 -top-1 h-6 w-6 rounded-full bg-foreground text-background grid place-items-center shadow"
            aria-label="Remove photo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button type="button" onClick={pickFile} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-60">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            Upload photo
          </button>
          <button type="button" onClick={() => setShowUrl((s) => !s)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
            <Link2 className="h-3.5 w-3.5" /> Use URL
          </button>
        </div>
        {showUrl && (
          <div className="flex gap-1.5">
            <input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={() => { onChange(urlDraft); setShowUrl(false); }}
              className="rounded-md bg-primary text-primary-foreground px-2.5 py-1 text-xs font-semibold"
            >
              Use
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
      </div>
    </div>
  );
}
