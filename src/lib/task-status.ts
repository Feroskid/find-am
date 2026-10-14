/** Shared helpers for task lifecycle status. */

export const CLOSED_TASK_STATUSES = ["cancelled", "canceled", "expired", "closed"];

export function isDeadlinePast(deadline?: string | null): boolean {
  if (!deadline) return false;
  const t = new Date(deadline).getTime();
  if (Number.isNaN(t)) return false;
  // Treat the whole deadline day as still valid.
  return Date.now() - t > 24 * 60 * 60 * 1000;
}

/**
 * Cancelled / expired tasks can no longer be opened or bid on.
 * A still-open task whose deadline has long passed counts as expired.
 */
export function isTaskClosed(input: { status?: string | null; deadline?: string | null; [k: string]: any }): boolean {
  const status = displayTaskStatus(input);
  if (CLOSED_TASK_STATUSES.includes(status)) return true;
  if (status === "open" && isDeadlinePast(input.deadline)) return true;
  return false;
}

export function closedTaskLabel(input: { status?: string | null; deadline?: string | null; [k: string]: any }): string {
  const status = displayTaskStatus(input);
  if (status === "cancelled" || status === "canceled") return "Cancelled";
  if (status === "closed") return "Closed";
  return "Expired";
}

/**
 * Status to show for a task, taking a resolved dispute into account:
 * a full refund to the poster shows as cancelled; a split or release to the
 * tasker shows as completed.
 */
export function displayTaskStatus(task: any): string {
  const status = String(task?.status ?? task?.task_status ?? "open").toLowerCase();
  const raw =
    task?.dispute?.resolution ?? task?.dispute_resolution ?? task?.resolution ?? task?.dispute_outcome ?? task?.dispute?.outcome;
  const resolution = String(raw ?? "").toLowerCase();
  if (!resolution) return status;
  if (resolution === "refund_employer" || resolution === "refund") return "cancelled";
  if (resolution === "split" || resolution === "release_tasker" || resolution === "release") return "completed";
  return status;
}
