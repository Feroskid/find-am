# Community control room (full edit access)

## What you get

There is no separate website address for the community — it lives inside your own app, on the same backend as everything else. So instead of an outside link, you get a **Community** tab inside your existing admin area (`/admin/community`) where you can edit anything in the community, plus direct data access from your Cloud backend view.

Access: your admin account, and anyone you mark as a community moderator.

## Sections in the new tab

**Categories**
- Create, rename, re-describe, change icon, reorder
- Hide or delete a category (threads inside are moved or removed with a confirmation)

**Discussions**
- Search and filter all threads (newest, most replies, reported, hidden)
- Edit a thread's title and body, move it to another category
- Pin / unpin, lock / unlock, hide / restore, delete permanently

**Replies**
- Open any thread and edit or delete individual replies
- Restore replies that were removed

**Members**
- Search community members, open a profile
- Edit display name, username, bio, signature
- Grant or remove moderator status
- Adjust points / rank, and suspend a member from posting

**Reports**
- The existing moderation queue stays; it gets a link into this new tab so a report opens the exact item for editing

## Direct data access

The community tables (categories, threads, replies, votes, members, reports, notifications) are already in your Cloud backend, viewable and editable from the backend panel in Lovable. I'll confirm the tables are all listed there and point you at them after the console is in place.

## Technical notes

- New route `src/routes/admin.community.tsx` (plus `admin.community.$section` sub-views if needed), added to the `TABS` list in `src/routes/admin.tsx`, so it inherits the existing `useAdminGate` protection and `noindex`.
- New server functions in `src/lib/community-admin.functions.ts`, each with `.middleware([requireSupabaseAuth])` and a guard that requires either platform admin (same check as `admin-gate`) or `is_community_mod`. No client-side role checks.
- Writes go through the authenticated user client so RLS still applies; a migration adds admin/mod-scoped policies (and GRANTs) where current policies only allow authors — e.g. moderator UPDATE/DELETE on `community_threads`, `community_posts`, `community_categories`, `community_profiles`.
- Adds `is_hidden`/soft-delete handling consistently, and a `community_moderation_log` table recording who changed what, with GRANTs and read-only-to-mods policy.
- Reuses `CommunityShell`-free plain admin styling to match the rest of `/admin`.

## Out of scope

- No public URL for editing, and no database password or service key exposure — editing stays behind admin sign-in.
