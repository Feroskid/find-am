# Plan — Task description page (fix + rebuild)

## 1. Fix navigation to the task detail page

Symptom reported: clicking a task in a list lands back on the homepage instead of the task page.

The route `/tasks/$taskId` and links (`<Link to="/tasks/$taskId" params={{ taskId: String(id) }} />`) already exist and resolve correctly in `routeTree.gen.ts`. The most likely real cause is that `getTask` errors at runtime (the route has no `errorComponent`/`notFoundComponent`, so a thrown error bubbles to the router's default boundary which can fall back to root), or the link receives `taskId: "undefined"` because the source row has neither `id` nor `task_id` populated.

Fixes:
- Harden `TaskCard`, `tasks.browse.tsx`, `dashboard.tsx`, `explore.tsx` list items: skip rendering the `<Link>` when `task_id`/`id` is missing; coerce id with `String(id)` only after the existence check.
- Add `errorComponent` + `notFoundComponent` to `createFileRoute("/tasks/$taskId")` so failed loads show a real error card with a Retry button (calls `router.invalidate()`), not a silent redirect.
- Wrap `getTask` response handling so non-2xx returns surface `data.error` instead of throwing.
- Verify the link by opening `/tasks/1` directly in the live preview via Playwright and confirming the detail renders (not the home).

## 2. Rebuild the description page to match Airtasker (mobile-first)

Target: the four uploaded screenshots. Rewrite `src/routes/tasks.$taskId.tsx` with the same building blocks but the Airtasker visual rhythm. Brand purple stays as the primary CTA color (per project memory).

Page structure (top → bottom, mobile single column, two columns ≥ md):

1. **Top filter strip** (mobile only) — small subtle row: `Category · 8 more ▾   Ren🔍`. Visual only, no logic change.
2. **Status row**: three pills — `OPEN`, `ASSIGNED`, `COMPLETED` (filled green for active) + `♡ Follow` on the right.
3. **Title block** — large display title; "← Return to browse" small link.
4. **Meta list** — Posted by (avatar + name + time-ago), Location (`📍` or `🌐` + View map), To be done on (`⏰ Flexible / Anytime` or date).
5. **Task budget card** (right column ≥ md, inline above tabs on mobile) — large `₦` budget, primary `Make an offer` button, `More Options ▾`, `🚩 Report this task`.
6. **Details** — full description; `Read more / Less` toggle when > 5 lines.
7. **Offers / Questions tabs** — dark pill bar with count badges (`Offers 8 / Questions 7`). Active tab is `bg-ink text-background` (kept).
   - **Offer card** (matches IMG_4099/IMG_4102):
     - Avatar, `Name`, blue verified check
     - `4.8 ⭐ (56)`
     - `100% Completion rate`
     - Optional badge: `🔷 Rebooked 2+ times in 2026`
     - Grey message bubble with `More ▾` expander
     - Footer: `↩ View replies (n)  · 16 days ago` + `⋯`
     - Poster-only `Accept` button on the right of the footer
     - Poster-only `Counter offer` button (opens negotiate modal — see §3)
     - Tasker-only `Edit my offer` when the offer belongs to the viewer
   - **Question card** (matches IMG_4103): same composer above, `View replies (n)` collapses thread of replies.
8. **Cancellation policy** block + `Learn more` link to `/terms#cancellation`.
9. **Sticky mobile bottom bar** (always visible on `< sm`):
   - Left: title + `Sun 28 Jun · Remote`
   - Right: `₦ budget · Task Budget`
   - Big purple `Make an offer` pill (CTA changes per viewer: see button matrix).

CTA button matrix (single source of truth for the sidebar + sticky bar):

| Viewer state | Button |
|---|---|
| Guest | `Log in to make an offer` → `/login?redirect=…` |
| Tasker, task open, no offer | `Make an offer` (opens offer modal) |
| Tasker, has offer, status open | `Edit offer` (opens offer modal pre-filled) + `Open conversation` |
| Tasker, accepted | `Open workspace` |
| Poster, status open | `View applications` + `Open workspace` |
| Poster, assigned/complete | `Open workspace` |
| Any, task closed/expired | Disabled pill: `Task is {status}` |

## 3. Negotiation flow (offer + counter-offer + chat)

Backend has `POST /task/{id}/apply` (message only — no amount column), `GET /task/{id}/applications`, `PUT /task/{id}/accept/{tasker_id}`, `POST /task/{id}/message`, `GET /task/{id}/messages`. There is no dedicated counter-offer endpoint, so encode offer amounts into the structured message body and parse them back out client-side.

### Offer modal (tasker → poster)
- Reuses the existing `Dialog`.
- Fields: **Your price (₦)** (defaults to budget), **Message** (20–2000 chars), optional **Earliest start**.
- Submission writes the message in a parseable header form so it round-trips:
  ```
  [OFFER ₦12,500]
  {message body}
  Earliest start: 2026-07-01
  ```
- After success: optimistic `queryClient.setQueryData(["task", taskId])` prepending the new application, then `refetch()`.
- "Edit offer" reuses the same modal pre-filled from the existing application; sending posts a new application (API doesn't expose update) — UI labels the latest one as "Current offer" and collapses earlier attempts.

### Counter-offer modal (poster → tasker)
- New `Dialog` triggered from each offer card's `Counter offer` button.
- Fields: **Counter price (₦)** (defaults to current offer amount), **Message** (required).
- Posts via `sendMessage` against the task thread with header `[COUNTER ₦10,000 to {tasker_name}]\n{body}`.
- Counter messages render inline under the relevant offer card as a styled "Counter" pill thread (parsed from `listMessages`).
- A "Accept counter" button appears for the tasker (the other side) when they see a `[COUNTER ...]` message: it resubmits a new application at that price (`applyToTask`) AND links to `Open workspace` after success.

### Negotiation thread (chat-style)
- Below the offers tabs, optionally render a per-offer collapsible "Replies" sub-thread (matches Airtasker's `View replies (n)`).
- Source: `listMessages({ taskId })` — group messages by author or `reply_to` heuristic; if API doesn't support threading, show as one chronological list scoped to each offer's two participants (poster + that tasker).
- Composer: `Reply…` textarea per card, posts via `sendMessage` with header `[REPLY-TO offer:{application_id}]\n…`. Filter client-side on read.

### Accept / Reject
- `Accept` calls `acceptApplicant({ taskerId })` → toast + refetch + auto-navigate to `/tasks/$taskId/workspace`.
- `Reject` (poster, per offer) — no backend endpoint; instead post a system message `[DECLINE]` against the thread and visually mark that offer card "Declined". (Add a TODO comment so a future backend `decline` endpoint can replace this.)

## 4. Field parsing helpers (new file)

`src/lib/offerParse.ts`:
- `parseOfferAmount(message): number | null` — regex `\[(?:OFFER|COUNTER) ₦([\d,]+)`.
- `formatOfferMessage({ amount, body, start? })`.
- `parseCounterTarget(message): { taskerId?: string }`.
- Pure, fully covered by 3 small inline asserts.

## 5. Files

- `src/routes/tasks.$taskId.tsx` — rewrite as above; keep export shape stable.
- `src/lib/offerParse.ts` — new.
- `src/components/TaskCard.tsx`, `src/routes/tasks.browse.tsx`, `src/routes/dashboard.tsx`, `src/routes/explore.tsx` — skip rendering tile when id missing.
- `src/components/TaskHeader.tsx` — no changes (FindAmIsland + purple `+` button stay; the Airtasker wordmark style is already in place).

## 6. Verification

- Run `bun run typecheck` (the harness will).
- Launch Playwright headless against `http://localhost:8080/tasks/1`, screenshot, confirm: title renders, sticky bottom bar shows on `375×800` viewport, `Make an offer` opens modal.
- Click a task card from `/tasks/browse` in Playwright; confirm URL becomes `/tasks/<id>` (not `/`).

## Out of scope

- Adding an `amount` column / dedicated counter-offer endpoint on the backend.
- Realtime updates (no WS in API docs).
- Cancellation-fee logic (display only; link to `/terms`).
- Redesigning the existing `/tasks/$taskId/applications` poster summary page — the in-page Offers tab replaces it for the common case.
