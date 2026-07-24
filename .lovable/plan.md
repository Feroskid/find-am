## Issues

**1. "My assigned tasks" shows "Untitled task" for every row (tasker side)**

`src/routes/tasks.mine.tsx` reads each row as a flat task: `t.title`, `t.budget`, `t.status`, `t.is_remote`, `t.location_text`, `t.deadline`. That's correct for the poster's `role=poster` response, but the tasker's `role=tasker` response from `GET /user/{id}/tasks` returns each row as an offer/assignment wrapper — the task fields live under `t.task` (with fallbacks like `t.task_title`, `t.task_budget`). Because the wrapper has no top-level `title`, every card falls back to "Untitled task" and shows ₦0 style defaults (that's also why status shows "accepted" from the offer, not the task).

**2. Workspace: Tasker never sees "Mark complete", Poster never sees "Release payment"**

In `src/routes/tasks.$taskId.workspace.tsx`:

- `isTasker` compares `myId` against `task.tasker_id ?? accepted_tasker_id ?? assigned_to`. For accepted offers the backend commonly returns the assigned user under different keys (e.g. `assigned_tasker_id`, `accepted_user_id`, `tasker.user_id`), so `isTasker` resolves to `false` and the "Mark task as complete" button is hidden.
- `awaitingRelease` only flips on for a narrow status whitelist (`completed_by_tasker`, `pending_release`, etc.) plus `task.tasker_marked_complete`. The real backend status after tasker completion is typically `awaiting_confirmation` / `awaiting_payment` / `pending_confirmation` — none of which are in the list — so the Poster's "Release payment" block never renders.

## Fix — two files only

### `src/routes/tasks.mine.tsx`

Normalize each tasker row before rendering so the card reads from the nested task when present:

```ts
const row = t.task ?? t;                       // unwrap offer/assignment wrapper
const id = row.task_id ?? row.id ?? t.task_id ?? t.id;
const title = row.title ?? t.task_title ?? t.title ?? "Untitled task";
const budget = row.budget ?? t.task_budget ?? t.budget ?? 0;
const remote = !!(row.is_remote ?? t.is_remote);
const loc = row.location_text ?? row.location ?? t.location_text;
const deadline = row.deadline ?? t.deadline;
const status = String(row.status ?? t.task_status ?? t.status ?? "open").toLowerCase();
const offers = row.offers_count ?? row.applications_count ?? 0;
```

Use these in the JSX and in the search/filter memo (so search-by-title and status filter also work for taskers). Poster mode is unaffected because `row = t.task ?? t` falls back to `t`.

### `src/routes/tasks.$taskId.workspace.tsx`

Broaden identity and status detection so both buttons render:

1. Widen `taskerId` resolution:
   ```ts
   const taskerId =
     task?.tasker_id ?? task?.accepted_tasker_id ?? task?.assigned_to ??
     task?.assigned_tasker_id ?? task?.accepted_user_id ??
     task?.tasker?.user_id ?? task?.tasker?.id ?? task?.assignee_id;
   ```
   Also treat the viewer as the tasker when they own the accepted offer: if `task.accepted_offer?.user_id === myId` (or `task.my_offer?.status === "accepted"`), set `isTasker = true`.

2. Expand `AWAITING` to include the statuses the backend actually emits:
   ```ts
   const AWAITING = [
     "completed_by_tasker","pending_release","awaiting_release",
     "work_submitted","submitted",
     "awaiting_confirmation","awaiting_payment","pending_confirmation",
     "pending_payment","tasker_completed",
   ];
   const awaitingRelease =
     AWAITING.includes(status) ||
     Boolean(task?.tasker_marked_complete ?? task?.completed_by_tasker ?? task?.is_awaiting_release);
   ```

3. Enforce the ordering rule you asked for — Poster's "Release payment" only appears after Tasker clicks "Mark complete":
   - Tasker button visible when `isTasker && inProgress && !awaitingRelease && !isCompleted`.
   - Poster release visible when `isPoster && awaitingRelease && !isCompleted` (already correct once `awaitingRelease` is computed properly).

No other files change. No changes to auth, routing, or data fetching — just field-name normalization and status-set widening.

## Verification

After the edit, use Playwright with the provided account to:
- Open `/tasks/mine` in tasker mode and confirm titles/budgets/statuses show for the 5 assigned rows in the screenshot.
- Open the workspace for one assigned task as the tasker → "Mark task as complete" is visible; click it.
- Switch to the poster account (or check a task the user posted that's now `awaiting_release`) → "Release payment" is visible only after the tasker's click.