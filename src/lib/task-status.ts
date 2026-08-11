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
export function isTaskClosed(input: { status?: string | null; deadline?: string | null }): boolean {
  const status = String(input.status ?? "").toLowerCase();
  if (CLOSED_TASK_STATUSES.includes(status)) return true;
  if (status === "open" && isDeadlinePast(input.deadline)) return true;
  return false;
}

export function closedTaskLabel(input: { status?: string | null; deadline?: string | null }): string {
  const status = String(input.status ?? "").toLowerCase();
  if (status === "cancelled" || status === "canceled") return "Cancelled";
  if (status === "closed") return "Closed";
  return "Expired";
}
