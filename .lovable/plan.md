# Plan — 5 focused UI/UX upgrades

Scope is presentation + client wiring only. No backend, schema, or auth changes.

## 1. Task description + apply flow (priority)

**File:** `src/routes/tasks.$taskId.tsx`

- Replace the inline sidebar apply form with a dedicated **"Make an offer"** modal (shadcn `Dialog`) so the flow matches Airtasker.
  - Fields: **Your price (₦)** (required, numeric, min 100, defaults to task budget), **Message to poster** (required, 20–2000 chars, counter shown), optional **Estimated start date**.
  - Inline validation, disabled submit until valid.
  - Submits via existing `applyToTask` server fn (`/task/{taskId}/apply`). Adds `amount` to the message body when offer price differs from budget so it round-trips through the API's free-form `message` field (backend currently has no amount column).
  - On success: toast, close modal, optimistic prepend into `offers` via `queryClient.setQueryData`, then `refetch()`.
- Restyle the **Offers tab**:
  - Cards show avatar, name + verified tick, rating + review count, completion %, offer message, time-ago, **₦ offer amount** pulled from `offer.amount ?? offer.price ?? task.budget`.
  - Poster-only **Accept** button on each card → calls `acceptApplicant` (already exists).
  - Empty state CTA "Be the first to make an offer".
- Restyle the **Questions tab** with a "Ask a question" composer (reuses `sendMessage` against task thread) — public Q&A list, poster replies inline.
- Right sidebar budget card: keep the price; primary CTA becomes **Make an offer** (opens modal). When the user has already applied, show **Offer sent** + link to workspace.
- Sticky mobile bottom bar: same modal trigger.
- Loading / error states tightened (skeleton for header + sidebar while `isFetching`).

## 2. Dashboard pagination — my tasks + recommended

**File:** `src/routes/dashboard.tsx`

- Extract a small `<Pager page total pageSize onChange />` helper (rendered as Prev / page x of n / Next, shadcn-styled).
- **My posted tasks** (`PosterMain`): page size 6, loading skeleton rows (6 placeholders), empty state preserved, footer pager.
- **Recommended tasks** (`TaskerMain`): switch to server-side pagination using `listTasks({ page, limit: 6 })` driven by local `page` state; keep `useQuery` with `queryKey: [..., page]` and `placeholderData: keepPreviousData` to avoid flicker. Skeleton grid (6 card placeholders) on first load; subtle dim on page change.
- Both pagers share constants `PAGE_SIZE = 6` and identical loading-state component.

## 3. MainMenu dropdown render fix

**File:** `src/components/MainMenu.tsx` (+ small CSS check in `styles.css`)

Symptom from screenshot: tapping the hamburger does nothing visible.

- Replace the hand-rolled overlay with shadcn **`Sheet`** (`side="left"`) so it's rendered through Radix's portal and escapes any ancestor `overflow:hidden` / stacking-context traps (the current `fixed inset-0 z-[60]` is a child of the sticky header which sets `z-30` + `backdrop-blur`, which is the most likely cause).
- Keep exact visual spec from the uploaded Airtasker screenshot: top bar with X + purple **Post a task** pill, profile row (name + "Public Profile"), list rows with right chevrons, Logout at bottom.
- Ensure `<SheetContent>` has `w-full sm:max-w-[420px] p-0 overflow-y-auto`.
- Body scroll-lock handled automatically by Radix.
- Hamburger button stays in `TaskHeader`; just swaps `MainMenu` internals.

## 4. Tasker dashboard: render TierProgress + restyle KPIs

**File:** `src/routes/dashboard.tsx`

- TierProgress is already imported and rendered for tasker mode (line 132–136) but currently uses `balance` as "earnings". Switch to a dedicated `earnings30d` value derived from `walletTransactions` (sum of `credit` entries in last 30 days) via a new `useQuery`. Fallback to 0 when unavailable.
- KPI cards (`Kpi`) restyled to Airtasker look:
  - Larger numeric (font-display, text-3xl, text-ink).
  - Small uppercase label under the number.
  - Icon chip top-right (not left), softer surface (`bg-surface-soft`), 1px border, rounded-3xl, generous padding.
  - Trend line / sublabel slot (e.g. "this month") — optional, hidden when no data.
- Tasker KPI set re-ordered to: **Active**, **Completed**, **Rating**, **Earnings (30d)**.

## 5. FindAmIsland purple token consistency

**Files:** `src/components/FindAmIsland.tsx`, `src/styles.css`

- Add a single semantic token `--island-active` in `:root` and `@theme inline` (`--color-island-active: var(--island-active);`) mapped to the brand primary purple.
- Update FindAmIsland active pill to use `bg-island-active text-primary-foreground`. Inactive pill: `text-background/80 hover:text-background`.
- Outer pill: keep `bg-foreground` shell, but add `ring-1 ring-black/5` for subtle definition matching the screenshots.
- Sweep other "active pill" usages (tabs in task detail Offers/Questions — currently `bg-ink`) — leave alone; the island token is scoped to the island only to keep the contract narrow.

---

## Technical notes

- No new dependencies; uses existing shadcn `Dialog` + `Sheet`, lucide icons, sonner toasts, React Query.
- All server-fn calls already exist in `src/lib/findtask.functions.ts` (`applyToTask`, `acceptApplicant`, `sendMessage`, `walletTransactions`, `listTasks`).
- Pagination uses `keepPreviousData` from `@tanstack/react-query` (already a transitive dep of the template).
- No route additions → `routeTree.gen.ts` untouched.

## Out of scope

- Adding an `amount` column to applications on the backend.
- Realtime updates for offers/questions.
- Redesigning the poster's `/tasks/$taskId/applications` page (already exists separately).
