## 1. Workspace chat: system messages as neutral pills

In `src/routes/tasks.$taskId.workspace.tsx`, replace the message-rendering block (lines 159–172) with your version: messages where `is_system` is `1`/`true` render as a centered grey pill with no sender attribution; all other messages keep the current left/right bubble treatment with timestamp.

## 2. Remove the WhatsApp-style chat page

Verified: `src/routes/messages.$taskId.tsx` is a full dark WhatsApp clone (hardcoded `#0b141a` / `#005c4b` colours, bubble tails, "Switch to task" button).

- Delete `src/routes/messages.$taskId.tsx`.
- Update every link that pointed at it so nobody hits a dead route:
  - Assigned task participants → `/tasks/$taskId/workspace`.
  - Unassigned taskers who made an offer, and posters browsing offers → the task detail page `/tasks/$taskId`, Messages tab (where the offer thread already lives).
- Remove the defensive redirect in the workspace that currently bounces non-assigned viewers to `/messages/$taskId`; it will send them to `/tasks/$taskId` instead.
- Check `src/routes/messages.index.tsx`, `notifications.tsx`, `tasks.$taskId.index.tsx`, and `TaskCard` for links to the removed route and repoint them.

## 3. Wallet balance showing ₦0

Confirmed root cause: the dashboard reads `withdrawable_balance` from `/wallet/balance`, but `src/routes/wallet.tsx` reads `balance` / `available_balance`, which the backend doesn't return — so it always renders 0.

- Read the balance with the same key order the dashboard uses (`withdrawable_balance` first, then the other aliases as fallback).
- Do the same for the escrow/pending figure, and show a proper loading state instead of a hard `₦0` while the query is in flight.

## 4 & 5. BVN verification and "Add bank" not saving

Checked against the live backend spec (`https://api.find-am.com/openapi.json`):

- `POST /wallet/verify-kyc` expects `{ bvn, bank_code, account_number }` — our payload matches.
- `POST /auth/register-bank` expects `{ bank_code, account_number, account_name }` — our payload matches.

So the request shapes are correct; what's broken on the frontend is the **feedback and state** around them:

- The wallet page decides "Verified" / "bank on file" from `bal?.kyc_verified` and `bal?.bank`, keys the balance response does not necessarily return — so even a successful save still shows "Required" / "No bank account on file", making it look like nothing saved.
  Fix: source verification and bank state from the user profile (`/auth/me`) as well as the balance payload, and refetch both after a successful submit.
- Errors are only shown as small text inside the dialog and can be an empty string when the backend returns a `detail` object. Fix: surface the backend's real message (including 422 validation detail) in a toast plus inline, so a genuine backend rejection is visible rather than looking like a silent no-op.
- Bank list: if `/banks` returns a bare array rather than `{ banks: [...] }`, the select is empty and no code can be picked — handle both shapes.

Once these are in, if the backend still rejects a real BVN/bank submission, the exact server message will be visible on screen and we'll know whether the remaining problem is backend-side.

## Verification note

The saved test account no longer authenticates (`/auth/login` returns "Invalid email or password"), and no password was supplied, so I can't log in to confirm the live wallet payload end to end. I'll implement against the published API spec and the working dashboard behaviour; send a valid password when you have one and I'll re-run a live check on the wallet, BVN and bank flows.

### Files touched
`src/routes/tasks.$taskId.workspace.tsx`, `src/routes/messages.$taskId.tsx` (deleted), `src/routes/messages.index.tsx`, `src/routes/wallet.tsx`, plus any route linking to the removed chat page.
