import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Banknote, Globe, MessageSquare } from "lucide-react";

export interface TaskCardData {
  id: string | number;
  title: string;
  budget?: number | string;
  location?: string;
  category?: string;
  deadline?: string;
  description?: string;
  status?: string;
  is_remote?: number | boolean;
  poster_name?: string;
  offers_count?: number;
}

/** Adapter — accepts the raw API row and normalises field names. */
export function toCardData(t: any): TaskCardData {
  return {
    id: t.task_id ?? t.id,
    title: t.title ?? "Untitled task",
    description: t.description,
    budget: t.budget,
    location: t.location_text ?? t.location,
    category: t.category_name ?? t.category,
    deadline: t.deadline,
    status: t.status,
    is_remote: t.is_remote,
    poster_name: t.poster_name,
    offers_count: t.offers_count ?? t.applications_count ?? t.applicants_count ?? t.offer_count ?? 0,
  };
}


function formatBudget(b: number | string | undefined) {
  if (b == null || b === "") return "—";
  const n = typeof b === "string" ? Number(b) : b;
  if (Number.isFinite(n)) return `₦${Number(n).toLocaleString()}`;
  return String(b);
}

function formatDate(d?: string) {
  if (!d) return undefined;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function TaskCard({ task }: { task: TaskCardData }) {
  if (task.id == null || task.id === "" || task.id === "undefined") return null;
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
        {task.is_remote ? (
          <span className="inline-flex items-center gap-1"><Globe className="h-3.5 w-3.5" />Remote</span>
        ) : task.location ? (
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{task.location}</span>
        ) : null}
        {task.deadline && (
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDate(task.deadline)}</span>
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
        {Number(task.offers_count ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <MessageSquare className="h-3 w-3" /> {Number(task.offers_count)} offer{Number(task.offers_count) === 1 ? "" : "s"}
          </span>
        )}

      </div>
    </Link>
  );
}

