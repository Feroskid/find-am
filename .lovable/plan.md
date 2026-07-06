## Scope

Seven changes across the homepage footer, community forum, messages, and task escrow release flow.

---

### 1. Footer "About" → "Contact Us" + new Contact page

- `src/routes/index.tsx`: rename the footer "About" link to "Contact Us" pointing to `/contact`.
- New route `src/routes/contact.tsx`:
  - Head metadata (title, description, og tags).
  - Form fields: name, email, subject, message (zod-validated, length limits).
  - On submit, build a `mailto:integerpj@gmail.com?subject=…&body=…` URL with `encodeURIComponent`, then `window.location.href = mailto` so the user's default mail app opens.
  - Same visual language as the rest of Find-Am (dark hero, warm accents), plus a small "Or email us directly" fallback link.

---

### 2. Community — more features

Building on what already exists:

- **Rich thread composer**: category picker, markdown preview toggle, tag chips (stored as `text[]` on `community_threads`, new migration adds `tags` column + GIN index).
- **Thread page upgrades**: upvote/downvote wired to `community_votes` (already exists), "accept answer" for the thread author (adds `accepted_post_id` column to `community_threads` + `+5` points bump for accepted replies).
- **Pin/lock badges** rendered on category + thread pages.
- **Reply threading (1 level)**: use existing `parent_id` on `community_posts` to show nested replies.
- **Category sidebar** on `/community` with counts + "trending this week" list (threads ordered by score + recent activity).
- **User mentions** (`@username`) in posts: parse on render, link to `/community/u/$username`, insert a `mention` notification row.
- **Bookmarks**: new `community_bookmarks` table (user_id, thread_id) + toggle button on thread page + a "Bookmarks" tab on the profile.

---

### 3. Messages — make list rows clickable + WhatsApp-style chat

- `src/routes/messages.tsx`: wrap each conversation row in a `<Link to="/messages/$taskId" params={{ taskId }}>` (currently the row isn't clickable). Add hover/active states and unread bolding.
- Verify `/messages/$taskId` route (already exists) opens the WhatsApp-style pane; add mobile back-swipe affordance and desktop split layout (list on left, chat on right ≥ md).
- Ensure last-message preview + timestamp + unread badge refresh every 15 s.

---

### 4. `/community/moderation` — full moderator dashboard

Route exists but is minimal. Rebuild:

- Tabs: **Open reports**, **Resolved**, **Locked/pinned threads**, **User roles**.
- Each report card: reporter, target snippet (fetched via new `getReportTarget` server fn), reason, timestamps, action buttons (Lock, Unlock, Pin, Unpin, Delete, Warn user, Ban user).
- Optimistic UI: after an action, refetch reports + show toast; status pill updates immediately.
- Access guard: only users with `has_community_role(uid, 'moderator'|'admin')`; non-mods see a friendly "You don't have moderator access" page.
- Extend `community.functions.ts`: `listReportsByStatus`, `getReportTarget`, `warnUser`, `banUser`, `assignRole` (admin-only).

---

### 5. `/community/notifications` — proper feed

- Server fn `listMyNotifications({ cursor, limit=20 })` returning ordered rows + `nextCursor`.
- Client uses `useInfiniteQuery` with an IntersectionObserver sentinel for infinite scroll.
- Each row: icon by type (reply, mention, vote, accepted, mod-action), preview text, relative time, unread dot.
- Click marks that row read + navigates to target thread anchor.
- Header actions: "Mark all read", filter tabs (All / Unread / Mentions / Replies).

---

### 6. `/community/u/$username` — full profile

Route exists but basic. Upgrade:

- Header: avatar, display name, @username, rank badge, points, join date, thread/post counts.
- **Avatar upload** (owner only): reuse `AvatarUpload` component, upload to a new `community-avatars` Supabase storage bucket (public read, owner write), save URL to `community_profiles.avatar_url`.
- **Edit** button (owner) → inline edit for display_name / bio / signature.
- Tabs: **Threads**, **Replies**, **Bookmarks** (owner only), **Awards** (derived from rank milestones).
- Signature rendered under each of the user's posts on thread pages.

---

### 7. Task workspace — Release / Dispute flow

Studying the Find-Am docs & existing `src/routes/tasks.$taskId.workspace.tsx`:

Backend endpoints available (from the docs):
- `POST /tasks/{id}/complete` — tasker marks task complete (notifies poster).
- `POST /tasks/{id}/release-payment` — poster releases escrow to tasker wallet.
- `POST /tasks/{id}/dispute` — poster (or tasker) raises a dispute with a reason.
- `GET /tasks/{id}/escrow-status` — current escrow state (funded, held, released, disputed).

Frontend work:

- In `src/lib/findtask.functions.ts`, add server fns: `markTaskComplete`, `releasePayment`, `raiseDispute`, `getEscrowStatus` (wire to the endpoints above via existing api client).
- In `TaskHeader.tsx` / workspace:
  - When escrow status = `held` AND current user = poster AND task = `awaiting_release`: show **Release payment** (primary) and **Raise dispute** (secondary) buttons. Confirm modal for Release ("This transfers ₦X to the tasker's wallet — this cannot be undone").
  - Dispute modal: reason textarea (min 20 chars) + optional evidence text; POSTs to `/tasks/{id}/dispute`, then shows a "Dispute under review" banner.
  - Tasker view: after `markTaskComplete`, show a "Waiting for poster to release payment" banner with the escrow amount and last-updated time.
- Live status: poll `getEscrowStatus` every 20 s while the workspace is open, invalidate task query on any action.
- Toasts + optimistic UI, error handling for 400/409 (already-released, already-disputed).

---

### Files touched (summary)

New: `src/routes/contact.tsx`, `src/components/community/ThreadComposer.tsx`, `src/components/community/ReportCard.tsx`, `src/components/community/NotificationRow.tsx`, `src/components/community/ProfileTabs.tsx`, `src/components/tasks/ReleaseDisputeActions.tsx`, migration for `tags`, `accepted_post_id`, `community_bookmarks`, storage bucket `community-avatars`.

Edited: `src/routes/index.tsx`, `src/routes/messages.tsx`, `src/routes/community.moderation.tsx`, `src/routes/community.notifications.tsx`, `src/routes/community.u.$username.tsx`, `src/routes/community.t.$threadId.tsx`, `src/routes/community.new.tsx`, `src/routes/tasks.$taskId.workspace.tsx`, `src/components/TaskHeader.tsx`, `src/lib/community.functions.ts`, `src/lib/findtask.functions.ts`.

---

### Out of scope

- Admin-only Find-Am endpoints.
- Private DMs inside the community.
- Push notifications (in-app only for now).
- Email digests.

Ready to implement all 7 in one pass on approval.