import { useAuth, type AppMode } from "@/lib/auth";
import { Briefcase, Wrench } from "lucide-react";

export function ModeSwitcher({ compact }: { compact?: boolean }) {
  const { mode, setMode, token } = useAuth();
  if (!token) return null;
  const Btn = ({ m, label, icon: Icon }: { m: AppMode; label: string; icon: any }) => (
    <button
      onClick={() => setMode(m)}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
        mode === m
          ? "bg-primary text-primary-foreground"
          : "text-foreground/70 hover:text-foreground"
      }`}
      aria-pressed={mode === m}
    >
      <Icon className="h-3.5 w-3.5" /> {compact ? "" : label}
    </button>
  );
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5">
      <Btn m="poster" label="Poster" icon={Briefcase} />
      <Btn m="tasker" label="Tasker" icon={Wrench} />
    </div>
  );
}
