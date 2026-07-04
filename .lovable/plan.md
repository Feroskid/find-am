## 1. Footer Terms/Privacy clickability fix

- Verify `/terms` and `/privacy` routes exist and render.
- In `src/components/Footer.tsx`, ensure the legal links use `<Link to="/terms">` / `<Link to="/privacy">` (they do, but the parent container may be blocking clicks on the homepage — check for overlapping absolute elements on `/`).
- If an overlay on the index route is intercepting pointer events over the footer, add `relative z-10` (or fix the overlay's `pointer-events-none`) so the links become clickable from the homepage.

## 2. Messages inbox → WhatsApp-style

Rebuild `src/routes/messages.tsx` as a two-pane inbox reading `/my-conversations`:

- **Left pane (conversation list)**: circular avatar (initials fallback), other party name, task title as subtitle, last message preview truncated, right side shows relative time + unread count badge. Active row highlighted. Search box at top.
- **Right pane (chat)**: sticky header (avatar, name, task link, status), scrollable message area with WhatsApp-style bubbles (outgoing = primary tint right-aligned, incoming = muted left-aligned, timestamp + read tick under each bubble, grouped by day with date separators), sticky composer at bottom with textarea + send button.
- **Mobile**: list is full-screen, tapping a row pushes to chat view (`/messages/$taskId` — new route) with a back arrow. Desktop: side-by-side (list ~360px, chat fills).
- Reuses existing `sendMessage`, `listMessages`, `getConversations` server fns. Polls every 8s while thread open.
- Task workspace "Messages" tab keeps its own inline thread (no merge in v1).

New route: `src/routes/messages.$taskId.tsx` for the chat pane.

## 3. Full Forum Community ("Find-Task Community")

Fully separate account system from Find-Am, powered by Lovable Cloud (Supabase). Enable Lovable Cloud, then:

### Database (migration)
- `community_profiles` (id=auth.uid, username unique, display_name, avatar_url, bio, signature, points int default 0, rank text default 'Newbie', created_at)
- `community_categories` (id, slug, name, description, icon, sort_order, thread_count, post_count)
- `community_threads` (id, category_id fk, author_id fk, title, slug, body_md, is_pinned, is_locked, view_count, reply_count, last_reply_at, created_at)
- `community_posts` (id, thread_id fk, author_id fk, body_md, parent_id nullable, created_at, edited_at)
- `community_votes` (id, user_id, target_type enum('thread','post'), target_id, value smallint check in (-1,1), unique(user_id,target_type,target_id))
- `community_notifications` (id, user_id, type, payload jsonb, is_read, created_at)
- `community_reports` (id, reporter_id, target_type, target_id, reason, status, created_at)
- `community_roles` via existing `user_roles` pattern with app_role additions: `community_admin`, `community_moderator` (separate table `community_user_roles` to keep it isolated from Find-Am roles; uses `has_community_role()` security-definer fn)
- GRANTs + RLS on every table per rules.

### Auth (separate)
- Community sign-up/login lives at `/community/auth` — uses Supabase email/password + optional Google.
- On first login, a trigger creates a `community_profiles` row.
- Community routes read Supabase session; Find-Am's own token system is untouched. A user can be signed into both independently.

### Ranks (points-driven)
- Points formula (server-side trigger on insert/update of posts/threads/votes):
  - +2 per thread created, +1 per reply, +2 per upvote received, −1 per downvote received, +5 per accepted answer (future).
- Rank tiers (function `compute_rank(points)`):
  - 0–24 Newbie · 25–99 Contributor · 100–299 Regular · 300–999 Veteran · 1000–2999 Expert · 3000+ Legend
- Rank badge shown next to username everywhere.

### Routes (`src/routes/community.*`)
- `/community` — landing: category grid, latest threads, top contributors, join CTA.
- `/community/auth` — sign in / sign up (community-only).
- `/community/c/$slug` — category thread list w/ sort (latest, top, unanswered), pagination, "New thread" button.
- `/community/t/$threadId` — thread view: OP card, replies list, vote arrows, reply composer (markdown), pin/lock controls for mods.
- `/community/new` and `/community/c/$slug/new` — new thread composer (title + markdown body + tags).
- `/community/u/$username` — public profile: avatar, rank badge, points, join date, recent threads/posts, signature.
- `/community/search?q=` — Postgres full-text search across threads + posts.
- `/community/notifications` — list, mark read.
- `/community/moderation` — mod-only queue of reports.
- `/community/settings` — edit display name, avatar upload (Supabase storage bucket `community-avatars`), signature, password.

### Server functions (`src/lib/community.functions.ts`)
- `listCategories`, `listThreads({categoryId, sort, page})`, `getThread`, `createThread`, `replyToThread`, `editPost`, `deletePost`, `voteOn({target_type,target_id,value})`, `reportContent`, `searchCommunity`, `listNotifications`, `markNotificationRead`, `getProfile`, `updateProfile`, `moderationList`, `pinThread`, `lockThread`.
- Public read fns use server publishable client + `TO anon` SELECT policies (list categories, list threads, view thread — read-only).
- Write fns use `requireSupabaseAuth`.

### UI design language (distinct from Find-Am marketing site)
- Editorial forum vibe: warm neutral background (`#F7F5F0`), deep ink text, single accent (amber `#E5A54B`), rounded 12px cards with subtle 1px borders, no gradients. Display font: **Fraunces** (headings), body: **Inter**. Rank badges as small pill chips with tier color (Newbie gray → Legend amber).
- Thread rows: avatar left, title + category tag + reply count + last-reply relative time, hover highlight.
- Thread view: left rail with author card (avatar, rank, points, join date, post count), right pane with post body + vote column, reply composer at bottom.
- Mobile-first, WhatsApp-list feel on category pages.

### Notifications
- On new reply to a thread you authored → insert row into `community_notifications` via db trigger; bell in community header shows unread count.

### Moderation
- Report button on every post → `community_reports` row.
- Mods see `/community/moderation` list; can delete post, lock thread, or dismiss.
- Admin role grantable via Cloud SQL editor (documented in code comment).

### Navigation
- Add "Community" link in `TaskHeader` and `Footer`.
- Community pages use their own `CommunityShell` layout (own header with own auth state, own nav: Home · Categories · Latest · Search · Notifications · Profile).

### Out of scope for v1
- Private DMs inside forum (Find-Am messages already handle that).
- Email digests, gamification badges beyond rank, thread tags UI (schema-ready but no filter UI).

## Files touched / created (summary)
- edit: `src/components/Footer.tsx`, `src/routes/messages.tsx`, `src/components/TaskHeader.tsx`, `src/router.tsx` (already file-based), `src/styles.css` (add fraunces/inter + community tokens)
- new: `src/routes/messages.$taskId.tsx`, `src/routes/community.tsx` (layout), `src/routes/community.index.tsx`, `src/routes/community.auth.tsx`, `src/routes/community.c.$slug.tsx`, `src/routes/community.t.$threadId.tsx`, `src/routes/community.new.tsx`, `src/routes/community.u.$username.tsx`, `src/routes/community.search.tsx`, `src/routes/community.notifications.tsx`, `src/routes/community.moderation.tsx`, `src/routes/community.settings.tsx`, `src/components/community/*` (CommunityShell, ThreadRow, PostCard, VoteButtons, RankBadge, MarkdownEditor, AuthCard), `src/lib/community.functions.ts`, `src/lib/community.ranks.ts`, migration for all tables + triggers + RLS + GRANTs, seed migration for initial categories (General, Making Money, Task Tips, Tech, Off-Topic, Support).
