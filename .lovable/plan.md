# Dashboard, admin console and location-picker updates

## 1. Dashboard (`src/routes/dashboard.tsx`)
- Add a `getMe` server function for the backend `/auth/me` endpoint (it does not exist in the API layer today) and wire it as `const me = useServerFn(authMe)`.
- Add the `meQ` query (`["dashboard","me",token]`, enabled when signed in) alongside the existing queries, keeping hook order stable.
- Earnings filter: only count credit transactions whose `status` is `available` (pending credits stop inflating the 30-day figure and the tier progress).
- Rating now comes from `meQ` instead of the cached auth user, falling back to `—`.

## 2. Report a task (`src/routes/tasks.$taskId.index.tsx`)
The backend accepts `{ reason, description? }` as free text, so the 422 you see is a value mismatch, not a shape mismatch — the exact accepted reason list is not published in the API docs. First step is a live probe of the report endpoint with the current option values to read the validation message back, then align the dropdown to the values the backend accepts and pass the free-text detail as `description`. Errors from the endpoint will be surfaced verbatim in the toast instead of a generic message.

## 3. "I've arrived" too far away
The arrival endpoint checks the ping against the task location. The current handler swallows the backend wording into a guessy fallback. Fix: show the backend's own message, and when it is a distance rejection, present a clear panel — how far off the pin the tasker is, plus a "re-check my location" retry — rather than a bare toast. Also block the tap when the fix is stale/low accuracy with an explanatory message.

## 4. Re-dispute of a resolved dispute
Verify the flow and make sure the backend's rejection message ("already resolved") is shown as a readable notice on the dispute form, with the dispute button disabled for tasks whose dispute is already resolved.

## 5. Remove "View task chat history" from disputed tasks
Drop that action from the disputed-task view (line ~1232 of the task detail route).

## 6. Admin: disputes
- Show the disputed task's budget on each dispute card and inside the dispute room header, falling back to the amount field when budget is absent, so refund/split decisions have the money in view.

## 7. Admin: ban / freeze with reason
- Both endpoints accept an optional `reason`. Add it to the server functions and prompt the admin for a reason before ban/freeze (required, short free text).
- Surface that reason in the audit log rows so past actions are explainable.

## 8. Admin: user context and search
- Map the user-context endpoint into Users management: searching a user and selecting them opens a context panel (tasks, disputes, wallet/ledger summary, flags) inline under the row.
- Reuse the same admin user-search control in Users management and in Held funds (so an admin can find a user/task without typing raw IDs).

## 9. Admin: remove BVN blacklist
Delete the blacklist page and its nav entry (the server functions stay unused/removed with it).

## 10. Admin: ledger filter + download
The ledger endpoint supports `date_from`, `date_to` and `limit`. Add those as filter inputs to the ledger view, and a "Download CSV" button that exports the currently filtered rows client-side.

## 11. Admin: monitoring — reviewed checkbox
There is no backend endpoint to mark a flagged message reviewed (only a `status` filter on read). Add a per-message "Reviewed" checkbox whose state is stored locally per admin browser, with reviewed rows dimmed and a "hide reviewed" toggle. If you'd rather have this shared across admins, it needs a backend field first — say the word and I'll flag it as an API request instead.

## 12. Location picker (`src/components/LocationPicker.tsx`)
Apply the address autocomplete exactly as specified:
- `searchAddress` helper using Photon, biased to the current pin or Lagos.
- New state: `suggestions`, `showSuggestions`, `searching`, `pickingRef`.
- Debounced (300ms) search effect that skips the round-trip right after a suggestion is picked.
- `pickSuggestion` sets the pin and address together.
- Address input wrapped in a relative container with the suggestion dropdown, and the label spinner showing "Finding address…" vs "Searching…".

## Technical notes
- New/updated server functions in `src/lib/findtask.functions.ts`: `getMe` (`GET /auth/me`), `adminBanUser`/`adminFreezeUser` gain an optional `reason` body, `adminViewLedger` gains `date_from`/`date_to`/`limit`.
- Files touched: `dashboard.tsx`, `tasks.$taskId.index.tsx`, `tasks.$taskId.workspace.tsx`, `admin.tsx`, `admin.users.tsx`, `admin.funds.tsx`, `admin.disputes.tsx`, `admin.dispute.$disputeId.tsx`, `admin.audit.tsx`, `admin.monitoring.tsx`, `LocationPicker.tsx`; `admin.blacklist.tsx` removed.
- No database or schema changes.
