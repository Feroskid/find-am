import { useEffect, useState } from "react";
import { Share, Smartphone, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useInstallApp } from "@/lib/install";

const DISMISS_KEY = "findam:install-dismissed";

export function InstallAppCard({ dismissible = false, className = "" }: { dismissible?: boolean; className?: string }) {
  const { ready, installed, canPrompt, promptInstall } = useInstallApp();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (dismissible) setHidden(localStorage.getItem(DISMISS_KEY) === "1");
  }, [dismissible]);

  if (!ready || installed || hidden) return null;

  const onClick = async () => {
    if (canPrompt && (await promptInstall())) return;
    setOpen(true);
  };

  return (
    <>
      <div className={`flex items-center gap-3 rounded-2xl bg-footer text-footer-foreground p-4 shadow-lg ${className}`}>
        <img src="/icons/icon-192.png" alt="" className="h-11 w-11 rounded-xl bg-background" />
        <div className="min-w-0 flex-1">
          <div className="font-bold">Install Find-am</div>
          <div className="text-xs text-footer-foreground/70">Home-screen icon, full screen, opens faster</div>
        </div>
        <button onClick={onClick} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          {canPrompt ? "Install" : "How"}
        </button>
        {dismissible && (
          <button
            aria-label="Close"
            onClick={() => { localStorage.setItem(DISMISS_KEY, "1"); setHidden(true); }}
            className="text-footer-foreground/60 hover:text-footer-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" /> Add to Home Screen</SheetTitle>
            <SheetDescription>Two taps in your browser</SheetDescription>
          </SheetHeader>
          <ol className="mt-4 space-y-3 px-4">
            {[
              <>Tap the Share button <Share className="inline h-4 w-4" /> at the bottom (or top) of Safari — or the menu (⋮) in Chrome</>,
              <>Scroll and tap <b>Add to Home Screen</b> (or <b>Install app</b>)</>,
              <>Tap <b>Add</b> — Find-am gets its own icon</>,
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl bg-muted p-3 text-sm">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-foreground text-background font-bold">{i + 1}</span>
                <span className="pt-1">{t}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 px-4 text-xs text-muted-foreground">Using Chrome on iPhone? Open find-am.com in Safari first.</p>
          <div className="p-4">
            <button onClick={() => setOpen(false)} className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground">Got it</button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
