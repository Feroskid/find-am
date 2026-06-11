## Phase 4 — 13 changes

### Quick header / mode fixes
1. **Remove "Browse tasks"** link from `TaskHeader` (desktop + mobile).
2. **Tasker-mode primary CTA**: when `mode === "tasker"`, swap "Post a task" button for **"Apply to tasks"** → `/explore`. Poster keeps "Post a task".
3. **Dynamic Island layering (desktop)**: move `FindAmIsland` from absolute-center overlay to its own row above the main header (sticky top-0, header becomes top-10) so it never covers dashboard content. Mobile keeps current behavior.

### Categories vs Explore (item 2)
4. **`/explore`** — already exists; tighten to random/recent tasks with filters: **Recency (newest/this week/this month)**, **Location (state+city)**, **Budget min/max**. Pull from `listTasks` sorted random.
5. **`/tasks/categories`** — redesign to fetch real Level-1 categories from `/task/categories`, expand each card to show its Level-2 children (`/task/categories?parent=`), clicking a sub-category opens `/tasks/browse?category_id=…`.

### Dashboard redesign (items 3, 7)
6. Rewrite `dashboard.tsx` with two distinct, polished views driven by `mode`:
   - **Poster view**: KPI strip (Posted, In escrow, Completed, Spent), "My posted tasks" table, quick "Post a task" CTA, recent applications, escrow status chips.
   - **Tasker view**: KPI strip (Applied, Active, Earned, Avg rating), "Recommended tasks" grid (calls `listTasks`), "My applications" list, earnings snapshot.
   - Clean card design, semantic tokens, no Island overlap.

### Profile picture (item 5)
7. In `profile.tsx`: add **Upload photo** (file input → Lovable Cloud Storage `avatars` bucket) **or** **Paste image URL** field; save to `photo_url` via `updateProfile`. Show preview avatar.

### New pages (item 6)
8. `/verify-email` — accepts `?token=` query, POSTs to `/auth/verify-email`, shows status + resend button (`/auth/resend-verification`).
9. `/reset-password` — two-step: request reset (email → `/auth/forgot-password`) and set new (`?token=` → `/auth/reset-password`). Password visibility toggle.
10. `/terms` — full Terms & Conditions + Privacy summary, table of contents, anchors.
11. `/community` — designed page: featured taskers, success stories, guidelines, join CTA, links to forum/social.
12. Add footer links across the app to these pages.

### Ratings (item 4)
13. After task `completed`, both parties see **Rate counterparty** card in `tasks.$taskId.workspace`:
    - Tasker → Poster: overall 1–5 stars + review (uses existing `rateTask`).
    - Poster → Tasker: **per-category** rating (uses task's category_id automatically) + review.
    - Display on public profile (`u.$userId`) — already wired; ensure category breakdown shows.

### Task detail + apply form (item 10)
14. Polish `tasks.$taskId.tsx`: hero block with title, poster name (link to `/u/{id}`), location, budget, **duration/deadline**, category, status pill, full description, attachments. Apply form already exists — restyle as a clear card with cover letter + proposed price + ETA fields; submit calls `applyToTask`.

### Secure chat (item 11)
15. Workspace chat (`tasks.$taskId.workspace.tsx`): add **client-side E2EE** using WebCrypto AES-GCM with a per-task key derived from `task_id + both user ids` via PBKDF2; encrypt `message_text` before `sendMessage`, decrypt on fetch. Show "🔒 End-to-end encrypted" badge. Server stores ciphertext only.
16. Notification email on new application is **backend's responsibility** — already triggered by `/task/{id}/apply`. Frontend will surface in-app via `NotificationsBell`.

### Location fix (item 12)
17. **Backend column is `location_lat` / `location_lng`** (per uploaded screenshot) but we send `latitude`/`longitude`. Fix `createTask` to send both `location_lat`/`location_lng` (primary) and keep `latitude`/`longitude` (fallback). Update `post-task.tsx` geolocation handler to set these fields and verify with a toast showing captured coords.

### Live map (item 13)
18. New `/map` route + `LiveTasksMap` component using **Leaflet + OpenStreetMap** (no API key). Asks for browser geolocation, pins user, queries `listTasks` and plots tasks with valid `location_lat/lng`. Real-time refresh every 30s. Link added in header.

### Files
- edit: `TaskHeader.tsx`, `FindAmIsland.tsx`, `dashboard.tsx`, `profile.tsx`, `explore.tsx`, `tasks.categories.tsx`, `tasks.$taskId.tsx`, `tasks.$taskId.workspace.tsx`, `post-task.tsx`, `findtask.functions.ts`, `index.tsx` (find-task homepage polish — item 9), `routeTree.gen.ts`
- create: `verify-email.tsx`, `reset-password.tsx`, `terms.tsx`, `community.tsx`, `map.tsx`, `LiveTasksMap.tsx`, `E2EE.ts` (crypto util), `RateCard.tsx`, `AvatarUpload.tsx`, `Footer.tsx`
- new server fns: `verifyEmail`, `resendVerification`, `forgotPassword`, `resetPassword`, `getSubCategories`, `uploadAvatar` (if needed via Cloud Storage)
- new dep: `leaflet`, `react-leaflet`

### Out of scope
- Real WebRTC realtime chat sockets (we poll every 5s).
- True zero-knowledge E2EE with key exchange UI — we derive a deterministic per-task key (good enough to hide content from casual DB reads; documented as such).
- Admin moderation tools.
- Avatar bucket creation if Lovable Cloud isn't enabled — will fall back to URL-only field.
