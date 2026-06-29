## Root cause

The backend's `PUT /task/{id}/accept/{tasker_id}` returns the Flutterwave hosted-checkout URL under the key **`payment_link`** (with `tx_ref`, `task_id`, `tasker_id`, `slots_remaining`, etc.). Our accept modal only reads `payment_url / checkout_url / authorization_url / link / url`, never matches, and falls through to the "no URL → mark accepted client-side" branch. Result:
- The button is stuck on "Opening Flutterwave…" (we set `payStage=processing` then never redirect).
- The task status never flips on the backend, so on refetch the offer is still `open` and **Accept / Decline stay visible** (image 2).
- The modal "Total to pay" shows the raw budget — it never adds the service fee, fixed fee, or VAT (image 1).

Decline is unaffected (already correct).

## Changes

### 1. `src/routes/tasks.$taskId.tsx` — accept-modal flow
- Read the response's `payment_link` (keep the other aliases as fallbacks).
- Pass `task_id` (and `tx_ref` for display) so the existing `/tasks/payment/callback` route can route back to the right task.
- On successful redirect, set `window.location.href = payment_link`. Flutterwave's hosted page already gives the user the real popup/checkout UI — no SDK needed.
- If the response has **no** `payment_link` AND status is something like `"accepted"`/`"assigned"` already, treat as no-pay-needed (current fallback path), refetch, and toast.
- If the response is `200` with no link and no status change, surface the backend `message` as an error in the modal instead of silently "succeeding".
- Render a **fee breakdown** in the confirm modal using `computeFees(offerAmount)` from `src/lib/fees.ts` via the existing `<FeeBreakdown />` component (Task budget, Service fee 10%, Fixed fee ₦100, VAT 7.5%, **Total to pay**, Tasker receives).
- Use `parseOfferAmount(payFor.message) ?? payFor.amount ?? task.budget` as the base, same as today, but pass it through `computeFees(...).total` for the headline figure.

### 2. `src/routes/tasks.payment.callback.tsx` — completion behavior
Already calls `paymentCallback({ tx_ref, transaction_id, status })`. After a successful confirmation:
- Invalidate the cached task by routing to `/tasks/$taskId` (the task page refetches on mount; status will now be `assigned` so Accept/Decline hide automatically).
- On success, additionally call `sendMessage` with the existing E2EE intro template so the inbox conversation opens automatically (already done in current `acceptM` mutation — move that side-effect here so it only runs after real payment confirmation, not on the pre-redirect accept call).

### 3. No backend, no SDK, no new secret
- We do **not** need `FLUTTERWAVE_PUBLIC_KEY` — the backend already hosts the checkout and returns the URL.
- We do **not** add inline Flutterwave JS.
- No changes to `src/lib/findtask.functions.ts` shape (the call already returns the raw JSON, including `payment_link`).

### 4. Quick verification (after build mode)
- Click Accept on an open offer → modal shows itemized fees and a Total = budget + service fee + ₦100 + VAT → "Pay & accept" redirects the browser to the `payment_link` host.
- After Flutterwave success redirect, `/tasks/payment/callback` shows ✓ and routes back to the task → Accept/Decline are gone, an inbox message exists for the tasker.
- Cancelling on Flutterwave returns with `status != success` → callback page shows failure, task offer still open, Accept/Decline still visible.

## Out of scope
- Adding a Flutterwave inline JS popup (not needed; backend gives a hosted URL).
- Changing fee math or backend acceptance/escrow logic.
- Decline button behavior.
