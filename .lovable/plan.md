# Phase 5 — Polish, redesign & end‑to‑end QA

## 0. Pending carry‑over (from Phase 4)
- Wire `AvatarUpload` into `profile.tsx` save flow if not already saving `photo_url`.
- Ensure E2EE workspace chat shows a graceful fallback when ciphertext can't decrypt (old plain messages).
- Verify `location_lat` / `location_lng` reach backend (toast confirmation already wired).

## 1. Task detail page (`/tasks/$taskId`)
Expand the current minimal layout into a full brief:
- Hero block: title, status pill, posted‑X‑ago, poster mini‑card (avatar, name, rating, link to `/u/$userId`).
- Meta strip: budget, location/remote, deadline countdown, category + subcategory, quantity, urgency.
- Description section with attachments grid (if `task.attachments`).
- Sidebar (sticky on desktop): budget + escrow info, FeeBreakdown preview, primary CTA (Apply / Manage / Open workspace), share button, report link.
- Applicants count badge for poster; "X people have applied" social proof for taskers.
- "Similar tasks" rail below (uses `searchTasks` by category_id).

## 2. Categories page (`/tasks/categories`)
- Fetch L1 categories; lazy‑expand L2 via `getSubCategories(parentId)` on open.
- Group as accordion cards with an icon per L1 (mapped from `findtask-categories.ts`).
- Search filter at top, "popular categories" pinned row, task counts per cat if available.
- Each subcategory chip links to `/tasks/browse?category_id=<id>`.

## 3. Homepage redesign (`/`)
Keep Find‑Am search identity but make it a true product home:
- Sticky compact header (logo, language, theme, Login / Get started).
- Hero: oversized search bar + voice + trending chips, supporting line "Find work or get work done across Nigeria".
- Dual CTA row: "Find work" → `/explore`, "Post a task" → `/post-task`.
- Live stats strip (tasks posted, taskers online — from `/analytics/summary` if present, else static copy).
- "How Find‑task works" 3‑step (Post → Match → Pay via escrow).
- Featured categories grid (6 tiles → `/tasks/browse?category_id=`).
- Recent open tasks rail (`searchTasks({ page:1 })`).
- Trust band (escrow, verified taskers, ratings, 24/7 support).
- Testimonials (reuse `community` STORIES).
- Footer (shared `Footer` component).

## 4. Post‑task redirect fix
Current `useEffect` redirects to `/login` the instant `token` is falsy — including during the first render before auth hydrates, which causes the "unnecessary redirect" loop.
- Gate redirect on `useAuth().ready` / hydration flag (add `ready` boolean in `auth.tsx` if missing).
- Show a brief skeleton while `!ready`.
- After successful create, only redirect to the new task page; do not bounce through `/dashboard`.
- Audit `dashboard`, `wallet`, `profile`, `notifications`, `messages`, `tasks.$taskId.workspace` for the same anti‑pattern and apply the same `ready` gate.

## 5. End‑to‑end route QA
Walk every route, fix anything broken. Tracked in a checklist file `.lovable/qa-phase5.md`:
- `/`, `/explore`, `/tasks`, `/tasks/browse`, `/tasks/categories`, `/tasks/$taskId`, `/tasks/$taskId/applications`, `/tasks/$taskId/workspace`
- `/post-task`, `/dashboard`, `/profile`, `/u/$userId`, `/wallet`, `/messages`, `/notifications`, `/map`, `/search`
- `/login`, `/register`, `/reset-password`, `/verify-email`, `/terms`, `/community`
For each: load via Playwright against `localhost:8080`, confirm no console errors, primary CTAs present, links resolve. Fix issues inline.

## Files
**Edit:** `src/routes/index.tsx`, `src/routes/tasks.$taskId.tsx`, `src/routes/tasks.categories.tsx`, `src/routes/post-task.tsx`, `src/lib/auth.tsx`, `src/routes/profile.tsx` (avatar save), `src/routes/tasks.$taskId.workspace.tsx` (decrypt fallback)
**Create:** `src/components/TaskMetaStrip.tsx`, `src/components/SimilarTasks.tsx`, `src/components/HomeHero.tsx`, `src/components/HomeHowItWorks.tsx`, `.lovable/qa-phase5.md`

## Out of scope
- Real‑time websocket presence
- Backend changes
- New deps