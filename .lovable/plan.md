# Community roles: hide Moderation, grant access, and match accounts

Three changes, all inside the Find-am app.

## 1. Moderation link only for the right people

Today the Moderation link in the community header shows for every signed-in
member. It will only appear when the member's own community record says they
are a moderator, super moderator, or admin.

Because roles can arrive from the service in a few shapes (a list of roles, a
level name, or true/false flags), the check reads all of them and treats
anything that is not one of those three as an ordinary member. If the service
sends no role information at all, the link stays hidden and the page itself
still refuses access — so nobody can reach it by typing the address.

## 2. Granting moderator access

A new "Roles" area appears inside the community Moderation page, visible only
to super moderators and admins:

- A list of everyone who currently holds moderator or super moderator, with
  their picture, name, rank and when they were given the role.
- A box to grant a role: type a username, choose Moderator or Super moderator,
  optionally limit a moderator to one category, then confirm.
- A Remove button on each row, with a confirmation step.
- Clear messages when a username doesn't exist, when the person already holds
  the role, or when the account signed in isn't allowed to grant roles.

Ordinary moderators see the queue but not this area.

## 3. Matching a community member to their Find-am account

In the admin console, the Users tab gets a "Community" panel:

- Search a member by community username and see their community side: name,
  picture, rank, points, threads, replies, joined date, suspended or not, roles.
- Beside it, the Find-am account that community profile belongs to: name,
  email, phone, verification state, tasks posted and completed, wallet state,
  account status.
- Differences worth an eye are called out — for example a suspended Find-am
  account whose community profile is still active, a brand-new account with an
  unusually old community history, or an unverified email.
- Buttons to open the full Find-am user record and the public community profile.

It also works the other way: from the Find-am user record you can jump to that
person's community profile when they have one.

If the service does not return the link between a community username and the
Find-am account, the panel says so plainly instead of guessing, and that part
becomes a backend change on your side rather than something the app can invent.

## Technical notes

- Gate: `useCommunityMe` in `src/lib/community-client.ts` already normalises
  roles; `canModerate` becomes strict (moderator / super_moderator / admin only)
  and `CommunityShell.tsx` switches its Moderation link to `c.canModerate`.
  `community.moderation.tsx` keeps its server-side 401/403 denial as the real
  gate.
- Roles UI: uses the existing `listCommunityRoles`, `grantCommunityRole`,
  `revokeCommunityRole` server functions hitting
  `GET/POST/DELETE /community/admin/roles` (endpoint confirmed present,
  returns 401 unauthenticated). Rendered as a new
  `src/components/community/RolesPanel.tsx` mounted in the moderation page
  behind `canSuspend`-style super-mod/admin check plus the API's own `level`.
- Admin panel: new `src/components/admin/CommunityUserPanel.tsx` in
  `admin.users.tsx`, combining `getCommunityProfile` with `adminSearchUsers` /
  `adminUserContext` from `findtask.functions.ts`. Link key is whatever the
  community profile exposes (`user_id` / `findam_user_id`); when absent, fall
  back to matching by the admin search and show an explicit "not linked by the
  API" note.
- No database or schema changes; all reads go through existing server functions.
