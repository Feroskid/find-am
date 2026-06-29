## 1. Fix Flutterwave callback 404 (`/task/payment/callback`)

The backend sends users to `/task/payment/callback` (singular) — our route is at `/tasks/payment/callback`. Flutterwave's return URL is fixed server-side, so we mirror the route at the singular path.

- Create `src/routes/task.payment.callback.tsx` with `createFileRoute("/task/payment/callback")`. It reuses the existing component logic from `tasks.payment.callback.tsx`.
- Since the backend's URL doesn't carry `task_id`/`tasker_id`, parse them from `tx_ref` (format `findtask-{taskId}-{hash}`) to drive the "Back to task" link and to fire the automated inbox message to the tasker.
- On successful callback: call `paymentCallback`, then `sendMessage` with the offer-accepted intro (already implemented), then redirect to `/tasks/$taskId` after 2s so the user lands on the task page (and Accept/Decline disappear because status is now `assigned`).
- Keep the old `/tasks/payment/callback` route as a thin re-export so both work.

## 2. Task detail: Questions → Messages, hide Accept/Decline post-payment

In `src/routes/tasks.$taskId.tsx`:
- When `task.status !== "open"` (i.e. assigned / in_progress / completed): rename the "Questions" tab label to **"Messages"**, drop the count badge, and restrict access to the poster + the assigned tasker (everyone else sees "Messaging unlocks when you're assigned").
- Hide both **Accept** and **Decline** buttons on every offer card whenever `task.status !== "open"` (currently Accept is gated on `status === "open"` but Decline isn't).
- Replace the sidebar "Cancel task" CTA with a **"Open dispute"** button when the task is `assigned`/`in_progress`, visible to both poster and the assigned tasker. Wire it to the existing dispute server function (or a placeholder that routes to `/tasks/$taskId/workspace#dispute` if none exists).

## 3. Dashboard KPIs + "My posted tasks" not showing (poster)

In `src/routes/dashboard.tsx`:
- The poster KPIs already read from `getUserTasks?role=poster`. The list comes back empty when the backend endpoint 404s for some accounts. Add a fallback: if `myTasksQ` returns `ok:false` or an empty list, refetch via `listTasks({ poster_id: myId, limit: 100 })` and merge.
- KPI counts include all statuses (`open`, `assigned`, `in_progress`, `completed`) → "Posted" = total length; "In escrow" = `assigned` + `in_progress` + `accepted` + `escrow`; "Completed" = `completed`. Already structured this way — fix relies on (a) above returning real data.
- Keep the same fix path for the **"My posted tasks"** list section (it shares `myTasks`).

## 4. Tasker "My tasks" shows "Untitled task"

The tasker's `getUserTasks?role=tasker` returns **application** objects, not task objects, so `.title` is missing.

In `src/routes/tasks.mine.tsx` (and the same shape used in dashboard if needed):
- Map each item: if `item.title` is missing but `item.task_id` exists, hydrate via `getTask({ taskId })` in a `useQueries` batch and use the returned task's title/budget/location/status.
- Cache hydrated tasks under `["task", id]` so they're reused on the detail page.

## 5. Messages page lists assigned + completed tasks

Replace the empty-state-only `src/routes/messages.tsx` with a real list:
- Fetch `getUserTasks` for both roles (poster + tasker) for the signed-in user; filter to statuses `assigned`, `in_progress`, `completed`.
- Render each as a row: title, counterparty name, last activity, status pill, linking to `/tasks/$taskId/workspace` (or `/tasks/$taskId` if no workspace).
- Show empty state only when both lists are empty.

## 6. Verify

- Manually hit `/task/payment/callback?status=completed&tx_ref=findtask-17-test&transaction_id=1` to confirm no 404 and that the intro message is sent.
- Sign in as the test poster, open dashboard → confirm "Posted" count > 0 and "My posted tasks" list populated.
- Sign in as test tasker, open `/tasks/mine` → confirm real titles instead of "Untitled task".
- Open an assigned task → confirm Questions tab now reads "Messages", Accept/Decline gone, Dispute visible.

## Files touched
- New: `src/routes/task.payment.callback.tsx`
- Edit: `src/routes/tasks.payment.callback.tsx` (extract shared component or re-export)
- Edit: `src/routes/tasks.$taskId.tsx` (tab rename, hide buttons, dispute CTA)
- Edit: `src/routes/dashboard.tsx` (poster fallback fetch)
- Edit: `src/routes/tasks.mine.tsx` (hydrate titles)
- Edit: `src/routes/messages.tsx` (real list)
