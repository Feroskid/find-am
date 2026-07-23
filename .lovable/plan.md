## Problem

On the task detail page, the poster sidebar shows **View applications** and **Open workspace**, but:

- The **Open conversation** button (which poster used to have) is missing from the poster's action block.
- **Open workspace** always links to `/tasks/$taskId/workspace`, but that route redirects unassigned viewers away (to `/messages/$taskId`) — so before a tasker is assigned, clicking it looks broken.
- **View applications** should only be meaningful while the task is open / has offers, but is currently always shown.

Root cause: the poster action block in `src/routes/tasks.$taskId.tsx` (around lines 558–592) was never updated to use the state-aware `conversationTo` value the tasker block already uses.

## Fix (single file: `src/routes/tasks.$taskId.tsx`)

Rewrite the poster action block so the buttons match task state:

1. **Always show "Open conversation"** for the poster, using the existing `conversationTo` value (already computed on line 255). This routes to `/messages/$taskId` before assignment and `/tasks/$taskId/workspace` after assignment — the same rule the tasker side uses. This restores the missing button.

2. **"View applications"** — show only when `status === "open"` (i.e. still accepting offers). After assignment there is nothing meaningful to review there.

3. **"Open workspace"** — show only when the task is in a workspace-eligible status (`useWorkspace === true`). Removes the confusing pre-assignment click that bounced to `/messages`.

4. **Cancel task / Open dispute** blocks below stay exactly as they are.

No other files, no logic changes to routes, auth, or data fetching.

### Resulting poster button order

```text
[Open conversation]        ← always (state-aware target)
[View applications]        ← only while status === "open"
[Open workspace]           ← only when task is assigned/active/completed
[Cancel task] OR [Open dispute]  ← unchanged
```

Tasker-side block and mobile sticky bar already use `conversationTo` and are left untouched.