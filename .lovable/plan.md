# Community control centre for Admin, Super mods and Mods

Five changes. Four can be done fully in the app today; one needs a small
addition on your service, and I say plainly which part.

## 1. Community moderation inside the admin dashboard

A new "Community" tab in the admin console, sitting beside Users and Reports:

- Counts at the top: open community reports, current moderators, super
  moderators, suspended members.
- The full report queue (open / resolved / dismissed) with the same actions the
  community page has: lock, pin, hide, resolve, dismiss, suspend.
- The moderator access box (grant and remove Moderator / Super moderator).
- The Community ↔ Find-am comparison that currently lives in the Users tab, now
  also here where it belongs.
- A link card on the admin overview page so it's one click from the dashboard.

Nothing is removed from the community-side Moderation page; the admin console
simply gets the same controls in one place.

## 2. Badges shown across the community

Admin, Super mod, Mod and Member badges will show everywhere a person appears:
thread lists, posts and replies, profiles, the moderation queue and the roles
list. Today they only show when the service happens to send a `badges` list, so
the app will also read the member's roles and turn those into badges, and give
everyone else a plain "Member" tag on their profile. Each badge keeps a distinct
colour: Admin black/gold, Super mod violet, Mod blue, Member grey.

## 3. Moderator and Super moderator dashboards

The community Moderation page becomes a proper dashboard, and what it shows
depends on the rank the service reports:

- **Moderator**: summary tiles (open reports, threads acted on, members
  checked), the report queue, thread and post actions, member lookup. No role
  granting, no suspending.
- **Super moderator**: everything above plus suspend / lift suspension and the
  moderator access box.
- **Admin**: everything, plus the activity record below.

## 4. Record of moderator actions for admin

Every action a moderator or super moderator takes through the app is recorded
and shown to admin in the new Community tab: who did it, what they did, which
thread, post or member, and when.

Honest limit: your service has no endpoint that returns a moderation history
(checked — nothing at `/community/admin/actions`, `/mod/log`, `/admin/audit`).
So the record will be built from two sources:

- What the report queue already tells us: who resolved or dismissed each report
  and when, plus who holds which role and since when. That part is real history
  from your service.
- Actions taken through this app (hide, lock, pin, suspend, grant, revoke) are
  written to your own Find-am audit log the app already uses, so they appear in
  the admin record straight away.

If a moderator ever acts outside this app, that won't appear until your service
exposes a moderation-log endpoint. When it does, the panel reads it with no
redesign needed.

## 5. "Back to Find-am" on mobile

The community header hides its whole navigation on small screens, so the
"← Back to Find-am" link disappears. A compact back-to-Find-am button will sit
in the mobile header row, and a bottom bar on mobile gives Home, Search,
Moderation (when allowed) and New thread.

## 6. The two endpoints you asked about

`GET /community/admin/identity/{username}` and
`GET /community/admin/lookup/{user_id}` were **not** integrated — the app was
matching members to accounts by name, which is why the panel sometimes said the
link wasn't available. Both exist on your service (they answer "not
authenticated" rather than "not found"). They will now be wired in:

- Typing a community username in the admin panel calls identity to get the real
  Find-am account id, so the comparison is exact instead of a guess.
- Opening a Find-am user record calls lookup to find their community profile,
  so the jump works in both directions.

## Technical notes

- New server functions `communityAdminIdentity` / `communityAdminLookup` in
  `src/lib/community.functions.ts` hitting those two endpoints; used as the
  primary link resolver in `CommunityUserPanel.tsx`, with the existing
  name-search only as a last-resort fallback.
- New route `src/routes/admin.community.tsx` + tab entry in `admin.tsx` and a
  card in `admin.index.tsx`. Shared moderation UI extracted from
  `community.moderation.tsx` into `src/components/community/ModerationQueue.tsx`
  so both surfaces render the same thing.
- `Badges` in `CommunityShell.tsx` gains a `member` fallback and role→badge
  derivation; `community-client.ts` already normalises roles.
- Action recording reuses the existing Find-am admin audit write path; the
  admin Community tab reads it filtered to community actions.
- Mobile: header gets a back button under `md:hidden`, plus a fixed bottom nav
  in `CommunityShell`.
- No database or schema changes.
