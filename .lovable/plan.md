# Fix community role mapping (Moderator / Super moderator)

## What's wrong (confirmed)

I signed in as the account you gave me (community name TestTwo). The service correctly says it is **both Super moderator and Moderator**. The problem is on the app side: the service sends each role as a small record, like "role: super_moderator, category: none". The app only understood roles sent as plain words. So it:

- showed "[object Object], [object Object]" in the admin comparison panel (your photo)
- showed "Member" on the profile
- hid the Moderation menu, because it didn't think the account was a moderator
- still showed the right badge on chats and replies, because that part of the service sends plain words

## Fixes

1. **One shared role reader** that understands every shape the service sends: plain words, role records with a category, and badge lists. Every screen will use it.
2. **Moderation menu** shows for this account on desktop and in the mobile bottom bar, and the page title reads "Super moderator dashboard".
3. **Profile page** shows Super mod and Mod badges instead of Member.
4. **Admin comparison panel** shows "Super moderator, Moderator" instead of "[object Object]", and a category next to a role when it is limited to one.
5. **Moderator team list** shows one row per person with both badges, rather than listing the same person twice.
6. **Find-am account link**: the panel said "the service found the member but returned no Find-am account id". I'll read the account id from any field name the identity lookup uses. If it really sends none, the panel will say that plainly.
7. **Voice recordings**: I'll transcribe all three and fix each item I can act on. Before I finish, I'll list what I heard so you can check it.

## How I'll check it

I'll sign in as the account in a test browser and confirm three things: the Moderation menu appears, the profile shows Super mod and Mod badges, and the admin panel shows readable role names.

## Technical notes

- Add `normalizeRoles(source)` in `community-client.ts`. It accepts strings, `{role, category}` objects, `badges` arrays and boolean flags, and removes duplicates.
- Use it in `useCommunityMe`, in `roleBadgeKeys`/`Badges` (`CommunityShell.tsx`), in `community.u.$username.tsx`, in `CommunityUserPanel.tsx` and in `RolesPanel.tsx` (grouped by `user.username`).
- The identity response is parsed for `user_id`, `findam_user_id`, `account_id`, `id` and nested `user.id`.
- No database changes.
