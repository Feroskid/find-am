## Goal

Replace the single "Mark complete & release" button in the task workspace with a two-step flow that matches the backend:

1. **Tasker** taps **Mark task as complete** → `POST /task/{id}/complete`
2. **Poster** then sees **Release payment** → `POST /task/{id}/release`
3. Task is only treated as **Completed** after the release call succeeds
4. Confirm the **Raise dispute** button is correctly wired to `POST /task/{id}/dispute` for both roles

All three server functions already exist in `src/lib/findtask.functions.ts` (`completeTask`, `releaseEscrow`, `disputeTask`). No backend/server-function changes needed — this is a UI wiring change.

## Changes

### `src/routes/tasks.$taskId.workspace.tsx`

- Add a `releaseEscrow` server-fn binding alongside the existing `completeTask` / `disputeTask` / `rateTask` bindings.
- Derive role + stage from the task payload:
  - `isTasker` = current user id matches `tasker_id / accepted_tasker_id / assigned_to`
  - `isPoster` = current user id matches `poster_id / user_id / owner_id`
  - `awaitingRelease` = status is one of `completed_by_tasker`, `pending_release`, `awaiting_release`, `work_submitted`, `submitted`, or backend flag `tasker_marked_complete`
  - `isCompleted` = status is `completed` / `released` / `paid_out`
- Replace the current single Actions block with role/stage-aware buttons:
  - **Tasker, status assigned/in_progress/accepted** → `Mark task as complete` (calls `completeTask`). On success: toast "Poster notified — awaiting payment release", refetch task. Do NOT open the rating modal here.
  - **Poster, awaitingRelease** → primary `Release payment` button (calls `releaseEscrow`). On success: toast "Payment released", refetch task, open the rating modal.
  - **Poster, awaitingRelease** → secondary helper text: "The tasker has marked this task complete. Review the work, then release payment to finish."
  - **Poster, status assigned/in_progress and NOT awaitingRelease** → no complete button (poster can no longer self-complete; waits for tasker).
  - **isCompleted** → "Leave a rating" button (existing behavior preserved).
- Keep the existing **Raise a dispute** flow visible to both roles whenever the task is assigned / in_progress / awaiting_release / completed-but-not-rated; verify it posts `{ reason }` (and optional `evidence_urls`) to `/task/{id}/dispute` via `disputeTask` — current wiring already does this, so just confirm and leave intact.
- Add lightweight loading + disabled states (`Loader2` spinner) on the new Release/Complete buttons, mirroring existing patterns.

### `src/routes/tasks.$taskId.tsx` (task detail page)

- The detail page currently shows an "Open dispute" button for assigned tasks; leave it as-is (it routes to the workspace where the dispute textarea lives). No endpoint change needed.
- If a "Mark complete" button exists on this page for posters, remove it so completion only happens from the workspace via the new two-step flow.

## Out of scope

- No changes to fees, payment-callback route, messaging, or notifications.
- No new server functions; the three endpoints are already implemented.
- No design-system / token changes.
