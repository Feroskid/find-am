## Problem

The "Open conversation" button on the task detail page (both the sidebar and the mobile sticky bar) links to `/tasks/$taskId/workspace`. That workspace is designed for an **assigned** tasker + poster — the messaging endpoint typically only opens up after acceptance, so a tasker who has only *applied* lands on a broken/empty page (or gets bounced), which reads as "the link isn't working."

We already have a working chat route at `/messages/$taskId` that handles pre-assignment Q&A between the applicant and poster.

## Fix

Route "Open conversation" to the correct page based on task status:

- If the task is **assigned/in_progress/awaiting_release/completed** and the current user is the assigned tasker or the poster → keep sending them to `/tasks/$taskId/workspace` (full workspace with location, complete/release, dispute, rating).
- Otherwise (applicant on an open task, poster reviewing an offer before accepting) → send to `/messages/$taskId` so they can actually chat.

### Files to change

**`src/routes/tasks.$taskId.tsx`**
- Compute a `conversationTo` target: `/tasks/$taskId/workspace` when `status ∈ {assigned, accepted, in_progress, active, completed_by_tasker, pending_release, awaiting_release, work_submitted, submitted, completed, released}`; else `/messages/$taskId`.
- Update the three "Open conversation" `<Link>`s (lines ~592, ~662, ~861) to use that target.
- Same treatment for the poster-side "Open conversation" affordance if present.

**`src/routes/tasks.$taskId.workspace.tsx`** (defensive)
- If the current user is not the poster and not the assigned tasker, redirect to `/messages/$taskId` instead of rendering an empty workspace. This closes the loophole if anyone deep-links to `/workspace` pre-assignment.

No backend / server-function changes. No design changes.

## Verification

- As the applicant tasker on an **open** task → "Open conversation" opens `/messages/$taskId` and messages load.
- As the assigned tasker or the poster on an **assigned** task → "Open conversation" opens `/tasks/$taskId/workspace` as before.
- Deep-linking `/tasks/$taskId/workspace` while unassigned → redirects to `/messages/$taskId`.
