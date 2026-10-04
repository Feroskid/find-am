# Fix username lookup, confirm role permissions, add live news, and restore sign-up

## 1. Username lookup should load the Find-am account
- When the Admin looks up a member by community username, take the linked Find-am user ID from the community search or identity result. Then load that exact account the same way the Find-am ID lookup does.
- Order: identity result, then the community search result for that exact username (exact match, not just a similar name), then the profile. Only show the "matched by name" warning when none of these return an ID.
- Show the ID that was found, so the Admin can tell which account was matched.
- When loading the account fails, show the real reason instead of leaving the panel empty.

## 2. Recheck the role permissions screen by screen
Review every screen against these rules and fix any gaps:
- **Moderator:** sees only thread and reply reports in their assigned categories, or all categories if they have no limit. Never sees reports on users. Can resolve or dismiss a report, with a required note. Can hide/unhide threads and replies, and pin/unpin and lock/unlock threads. Has no ban or role controls.
- **Super moderator:** everything above in all categories, plus reports on users, community ban/unban, grant/revoke Moderator, and the roles list.
- **Admin:** everything above, plus grant/revoke Super moderator, lookups in both directions, and platform bans in the admin console.
- Make sure the pin/lock/hide controls on the thread page follow the same rules as the moderation dashboard.
- The service still makes the final decision. The app only hides controls a role can't use.

## 3. Live news in the "Articles, stories & more" section
- On the Find-task page signed-out visitors see, replace the three placeholder cards with the latest 3 to 6 posts from https://singularityhub.com/feed.
- Each card shows the image (when there is one), category, title, short summary, and date. "Read more" opens the full article in a new tab.
- The feed is fetched on our server and stored for about an hour. If it is unavailable, the section shows a simple fallback instead of breaking the page.

## 4. Remove the Coming soon page
- Delete the Coming soon page.
- Point "Sign up", "Create an account", "Earn money", and the Find-task page buttons back to the registration page, as they were before.
- Remove it from the list of pages anyone can open without signing in.

## Technical details
- `CommunityUserPanel`: when looking up by username, call `searchCommunity`, pick the row whose username exactly matches (ignoring case), and pass `communityUserId(row)` to `adminUserContext`.
- New `src/lib/news.functions.ts`: a public `createServerFn` that fetches the RSS feed and parses `<item>` tags with a small regex parser that works on the server runtime (no DOMParser, no Node-only parsing library). It strips HTML from the summaries and takes images from `media:content`, `enclosure`, or the first `<img>`. The component reads it with `useQuery`.
- Delete `src/routes/coming-soon.tsx`. Change links in `MainMenu`, `Footer`, `login.tsx`, and `tasks.index.tsx` to `/register`, and update `SessionGuard`.
- Verification: typecheck/build, and check the public news section and sign-up links in the browser. You will test the signed-in role checks, as agreed before.
