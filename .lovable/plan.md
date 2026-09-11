# Community rebuild on the Find-am API

The community currently talks straight to the Lovable Cloud database from the browser and has its own separate sign-in. The handoff document moves all of it to the main Find-am API, using the same login as the rest of Find-task. This plan rebuilds the community to match, keeping the look and feel we already have and only changing where the data comes from.

## What members will notice

- No second sign-in. If you're logged into Find-task you're already in the community.
- The first time you visit, you pick a community username (3–20 characters, letters/numbers/underscore, changeable once a month). Your real name, email and phone are never shown.
- Profile pictures are chosen from a grid of 60 built-in pictures. New members start on the first one.
- Ranks shown exactly as the backend calls them: JJC, Contributor, Regular, Veteran, Agba, OG👑. Small labels for admin / super moderator / moderator next to usernames.
- Posts can carry up to 3 images (JPG, PNG or WebP, 5MB each, 20 uploads a day).
- Sorting by latest or top, paging through long categories, bookmarks, notifications bell with an unread count, search across discussions and replies, reporting, and a moderation queue for moderators.
- Banned members see the community read-only.

## Pages

| Page | Change |
|---|---|
| Community home | Categories with counts, plus a latest feed |
| Category | Paged thread list, latest/top toggle |
| Thread | Discussion, replies, votes, bookmark, accept-answer for the thread owner, "[removed]" placeholder for deleted replies |
| New thread | Title, body, tags, image attachments |
| Search | Matching discussions and replies |
| Notifications | Replies, mentions, accepted answers; marked read on open |
| Settings | Avatar grid, bio, signature, username change |
| Pick a username | New page, shown on first visit |
| Moderation | Reports queue and actions, only for moderators and above |
| Community sign-in | Removed — the main Find-task login is used |

## Technical section

**Data layer.** Replace `src/lib/community.functions.ts` with server functions that call `https://api.find-am.com/community/*` through the same `call()` helper style used in `findtask.functions.ts` (Zod-validated input, `{ ok, data } | { ok, status, error }` results, `Authorization: Bearer <findtask jwt>` forwarded from the client's `useAuth()` token). Public reads pass the token when present so `my_vote` / `is_mine` come back.

Endpoints wrapped: `me`, `username`, `profile` (PATCH), `u/{username}`, `categories`, `c/{slug}`, `threads/{id}`, thread create/patch/delete, `threads/{id}/posts`, post patch/delete, `accept/{post_id}`, `vote`, `bookmarks` (list + toggle), `notifications` + `read`, `search`, `report`, `images` (multipart passthrough), and the `mod/*` + `admin/roles` set.

**Error handling.** A shared helper maps 428 → redirect to the username page, 403 containing "banned" → read-only banner, 400 → inline validation message (banned-keyword hits land here), 413 → "image too large", 429 → "daily upload limit reached".

**Identity.** A `useCommunityMe()` hook wraps `GET /community/me` in React Query, keyed by the auth token, exposing `needsUsername`, `roles`, `badges`, `isBanned`. `CommunityShell` uses it for the header, the bell count, the New thread button and gating the Moderation link. Not-logged-in visitors still get public reads with a Sign in link to `/login`.

**Avatars.** Regenerate `public/avatars` as `a01.png` … `a60.png` (256px square) and rewrite `community-avatars.ts` to map an `avatar_key` to `/avatars/${key}.png`, default `a01`. Remove the old `av-NN` files and the id-hash assignment.

**Removals.** Delete `src/routes/community.auth.tsx`, all `supabase.*` usage inside community files, and community usage of `src/lib/avatar.server.ts` / the Cloud `avatars` bucket. `support.server.ts` and `media.server.ts` are untouched. The Cloud `community_*` tables are simply no longer read; no migration is run.

**Routes.** Add `src/routes/community.username.tsx`. Thread URLs move to `/community/c/$slug/$threadId` with the cosmetic slug dropped from the path; the existing `/community/t/$threadId` route stays as a redirect so old links keep working. Every route keeps its own `head()` metadata; moderation and username stay `noindex`.

**Client middleware.** Community server functions take the token as validated input, matching the existing `findtask.functions.ts` pattern, so no new auth middleware is added.

## Order of work

1. New data layer + error mapping + `useCommunityMe`.
2. Avatars regenerated and helper rewritten.
3. Shell, home, category, thread (votes/bookmark/accept/images).
4. New thread with image upload, search, notifications.
5. Settings, username page, profile page.
6. Moderation queue with role gating.
7. Delete the old sign-in page and remaining Supabase calls, then check every page end to end.
