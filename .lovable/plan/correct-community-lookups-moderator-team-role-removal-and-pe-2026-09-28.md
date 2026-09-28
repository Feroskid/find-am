# Correct community lookups, moderator team, role removal, and permissions

## 1. Make both account lookups reliable

- **Find-am account ID → community:** read the lookup response as a community member record, including roles supplied as role records rather than plain words.
- **Community username → Find-am:** use the linked Find-am user ID returned by the identity response, then load that exact Find-am account. Do not substitute a name match when an exact ID is available.
- Keep a clearly labelled name-only fallback only when the community service genuinely returns no linked ID.
- Show community roles as readable badges and labels, including category limits.
- Remove Tasks posted, Tasks working, and Wallet from the Find-am comparison. Keep only the account details the response provides: name, ID, email, phone, status, verification, and joined date.

## 2. Repair the moderator team list and role removal

- Normalize each role assignment into one reliable shape, whether the service nests the member under `user`, `member`, or `profile`, or places the fields directly on the row.
- Show each person's display name, username, picture, rank, all roles, category scope, and grant date.
- Group multiple assignments for one person into one member entry, while retaining a separate Remove control for each assignment.
- Send the role removal request using the assignment's real identifiers and exact scope. Show the service's error when removal is refused instead of silently leaving the row unchanged.
- Refresh the team list and admin counts after a successful grant or removal.

## 3. Enforce the requested permission levels in the screens

### Moderator

- See only thread and reply reports allowed by their assigned categories; an unscoped moderator can work across all categories.
- Never show reports against users.
- Resolve or dismiss a report with a required note.
- Hide/unhide replies and hide/unhide, pin/unpin, lock/unlock threads.
- No member bans and no role controls.

### Super moderator

- Everything a moderator can do, across all categories.
- Also see reports against users, ban/unban community members, grant/revoke Moderator, and see the roles list.
- Cannot grant or revoke Super moderator.

### Admin

- Everything above.
- Also grant/revoke Super moderator, use both identity lookup directions, and apply a platform ban through the admin console.

The service remains the final authority: the app hides unavailable controls, and every action is still rejected server-side if the signed-in role is insufficient.

## 4. Improve report handling and audit records

- Add a required moderator note before Resolve or Dismiss and send that note with the action.
- Filter user reports out of the Moderator view while retaining them for Super moderator and Admin.
- Record the note and exact action in the admin activity record for report, content, member, and role actions.
- Preserve category scope in activity entries so Admin can see where a moderator acted.

## 5. Verification

- Add focused checks for role normalization, assignment grouping, lookup response unwrapping, and permission filtering.
- Verify signed-out/public community pages still load and the project builds cleanly.
- Because the saved test login is currently rejected, authenticated role-by-role verification will be handed to you as a short checklist for Moderator, Super moderator, and Admin, as requested.

## Technical notes

- Centralize response unwrapping and role-assignment normalization instead of continuing to add one-off field guesses in each screen.
- Pass an explicit viewer level into the shared moderation and roles panels; do not infer Admin privileges from a fallback flag.
- Use the existing community endpoints for reports, content actions, bans, roles, identity, and lookup; use the existing admin user endpoints for the platform ban.
- No database changes.
