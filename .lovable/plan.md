# Phase 3 — Dual-mode accounts, fixes, and full endpoint coverage

## 1. Quick fixes (regressions you reported)

- **Login/Register → Dashboard**: change post-auth `navigate({ to: "/tasks" })` in `src/routes/login.tsx` and `src/routes/register.tsx` to `/dashboard`.
- **Task detail not opening**: audit `TaskCard` → it must link with the real backend id (`task.task_id ?? task.id`) to `/tasks/$taskId`. Fix any cards still using slugs/category routes. Confirm `tasks.$taskId.tsx` renders title, description, budget, location, deadline, poster info, apply form (tasker view) and "View applications / Workspace" (poster view).

## 2. Endpoint coverage audit vs PDF + api.find-am.com

Currently wired in `src/lib/findtask.functions.ts`: categories, search, get task, post, apply, list applications, accept, complete, dispute, rate, messages (list/send), notifications (list/unread/read/read-all), wallet balance.

**Missing — to add as server fns + UI hooks**:
- `GET /auth/me` (profile bootstrap) and `PUT /auth/profile` (update name, photo, location, tagline, about, categories).
- `GET /user/{id}` public profile (employer + tasker view).
- `GET /user/{id}/ratings` category-specific ratings + badges.
- `GET /user/{id}/tasks` posted + completed history.
- `POST /task/{id}/release` (release escrow) — split from `complete` per PDF.
- `POST /task/{id}/evidence` dispute evidence upload.
- `GET /task/{id}/applications/mine` (tasker's own application status).
- `GET /wallet/transactions`, `POST /wallet/withdraw`, `POST /wallet/bank` (verified bank).
- `POST /payments/initiate` and `GET /payments/verify/{ref}` — **Paystack** (PDF says Paystack, current code says Flutterwave; switch labels + endpoint).
- `GET /categories/level1`, `GET /categories/level2?parent=` for two-level structure.
- `POST /kyc/paystack/start` (verified payment badge).
- `POST /task/{id}/expire-check` not needed (server cron) — just show 30-day countdown.

If an endpoint 404s on the live API, the fn will surface the error; we keep the UI gated behind feature flags so the page still renders.

## 3. One account, two modes

- Remove `account_type` choice from register — every user is both Poster & Tasker.
- Add **Mode switcher** in `TaskHeader` (Poster ↔ Tasker) persisted in `localStorage` + auth context. Drives dashboard tab default and nav highlights, not permissions.
- **Dashboard** (`/dashboard`) becomes two tab views:
  - Poster: My posted tasks, applications received, escrow status, spend.
  - Tasker: Applied tasks, accepted/in-progress, earnings, response rate.

## 4. Profile pages

- `src/routes/profile.tsx` (own profile, editable) — both Employer and Tasker field sets per PDF, single form, photo upload.
- `src/routes/u.$userId.tsx` (public profile) — shows employer block + tasker block, category ratings, badges, member-since, verified-payment badge.
- `ProfileCard`, `CategoryRatingList`, `BadgeChip` components.

## 5. Categories (two-level)

- Replace flat list with Level 1 → Level 2 from API.
- `/tasks/categories` becomes Level 1 grid; clicking opens Level 2 drawer/list that deep-links into `/tasks/browse?category_id=...`.
- Post-task form: category auto-suggested from description (call `/task/categorize` if available, else show Level 2 picker).

## 6. Trust & Safety surfacing

- Keyword filter: post-task form shows backend validation error from `/task/post` verbatim.
- Badges + category ratings rendered on tasker cards in `tasks.$taskId/applications`.
- Min budget ₦2,000 enforced client-side in `post-task.tsx`.
- Fee preview: show `budget × 1.10 + 100 + VAT(7.5% of service fee)` breakdown before submit, and on accept-tasker modal.

## 7. Payments label correction

- Replace all "Flutterwave" copy with **Paystack** (escrow + KYC). Endpoint calls switch to `/payments/paystack/*` if present in API; otherwise keep generic `/payments/*`.

## 8. Files to add / edit

```
src/lib/findtask.functions.ts        (+ profile, public-user, payments, wallet tx, evidence)
src/lib/auth.tsx                     (add mode: 'poster'|'tasker', setMode)
src/components/ModeSwitcher.tsx      (new)
src/components/TaskHeader.tsx        (mount ModeSwitcher)
src/components/TaskCard.tsx          (fix id link, show category badges)
src/components/BadgeChip.tsx         (new)
src/components/CategoryRatingList.tsx(new)
src/components/FeeBreakdown.tsx      (new)
src/routes/login.tsx, register.tsx   (redirect /dashboard; drop account_type)
src/routes/dashboard.tsx             (Poster/Tasker tabs)
src/routes/profile.tsx               (new, editable)
src/routes/u.$userId.tsx             (new, public)
src/routes/post-task.tsx             (Level 2 picker, fee preview, min ₦2000, Paystack copy)
src/routes/tasks.$taskId.tsx         (poster vs tasker view, fee preview, escrow status)
src/routes/tasks.$taskId.applications.tsx (badges, category rating, Paystack copy)
src/routes/tasks.$taskId.workspace.tsx    (release vs complete, evidence upload on dispute)
src/routes/tasks.categories.tsx      (two-level)
src/routes/wallet.tsx                (new — balance, transactions, withdraw, bank link)
src/routeTree.gen.ts                 (regenerated)
```

## 9. Verification

After build: smoke-test each new route loads, login redirects to `/dashboard`, a card on `/tasks/browse` opens `/tasks/{id}`, post-task fee preview matches PDF example (₦40,000 → ₦44,400).

## Out of scope (note for later)

- Real ML auto-categorization (depends on backend `/task/categorize`).
- GPS location verification handshake.
- Admin dispute console.
- Badge revocation cron (server side).
