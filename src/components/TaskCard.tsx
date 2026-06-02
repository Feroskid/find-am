import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Banknote } from "lucide-react";

export interface TaskCardData {
  id: string | number;
  title: string;
  budget?: number | string;
  location?: string;
  category?: string;
  deadline?: string;
  description?: string;
  status?: string;
}

function formatBudget(b: number | string | undefined) {
  if (b == null || b === "") return "—";
  const n = typeof b === "string" ? Number(b) : b;
  if (Number.isFinite(n)) return `₦${Number(n).toLocaleString()}`;
  return String(b);
}

export function TaskCard({ task }: { task: TaskCardData }) {
  return (
    <Link
      to="/tasks/$taskId"
      params={{ taskId: String(task.id) }}
      className="block rounded-2xl border border-border bg-card p-5 hover:border-primary hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug line-clamp-2">{task.title}</h3>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary shrink-0">
          <Banknote className="h-4 w-4" /> {formatBudget(task.budget)}
        </span>
      </div>
      {task.description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {task.location && (
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{task.location}</span>
        )}
        {task.deadline && (
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{task.deadline}</span>
        )}
        {task.category && (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/70">
            {task.category}
          </span>
        )}
        {task.status && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary capitalize">
            {task.status}
          </span>
        )}
      </div>
    </Link>
  );
}
