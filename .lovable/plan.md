# Waitlist link, new contact email, mobile fit, and sitemap submission

## 1. Waitlist link on the "Coming soon" page

Add a clear button on the Coming soon page pointing to `http://waitlist.find-am.com`, opening in a new tab, placed above the existing "Go home" and "Browse tasks" buttons with short supporting copy ("Be first to know — join the waitlist"). The page's existing content stays as is.

## 2. Replace the contact email everywhere

The Contact page currently shows `integerpj@gmail.com` in two places: the line under the message form and the Email card. Both change to `Contact@find-am.com`, including the tap-to-email links.

Before changing anything, search the whole project for the old address so no other page, form, or automatic email is left using it, and update every match found.

## 3. Mobile side-scrolling

The complaint is that on a phone the page can be dragged sideways: something on the page is wider than the screen, so a horizontal scroll bar appears. That is a real, fixable layout issue.

The exact element causing it has not been confirmed yet, so the first step is to measure it rather than guess:

- Open the site at phone widths (about 360px and 390px wide) using an automated browser and list every element that extends past the screen edge, on each main page a visitor sees: home, Find-task home, browse tasks, categories, live map, explore, FAQ, contact, and the Coming soon page.
- Fix each offending element at its source — typically an over-wide fixed-width block, a row of items that cannot wrap, a negative side margin, or a full-width background sitting inside a padded container.
- Add a site-wide safeguard so the page cannot be dragged sideways even if something later overflows.
- Re-measure at both widths afterwards and confirm the page no longer scrolls sideways, and that nothing became cut off or unreadable as a result.

Deliberately side-scrolling strips (the filter row on Browse tasks, the category rails) keep scrolling inside their own strip; only whole-page dragging is removed.

## 4. Finish the sitemap and submit it to Google

The sitemap already exists and lists the home page, Find-task home, browse, categories, live map, explore, community, contact, privacy, terms, refund and FAQ.

Changes:

- Keep it built from genuinely public pages, and add any public page currently missing from the list.
- Leave `/profile` and `/messages` out. Both require signing in, redirect visitors who are signed out, and are already marked as hidden from search, so listing them would report errors in Google.
- Public member profiles (`/u/…`) are included only if a public, crawlable list of those pages can be produced; otherwise they stay out rather than guessing URLs.
- Check the sitemap loads correctly and returns the expected addresses before submitting.

Submission:

- Publish the site so the updated sitemap is live at the real address.
- Look up the verified Google Search Console property for find-am.com, then submit `https://find-am.com/sitemap.xml` to it and report Google's response, including any errors Google reports back.

## Technical notes

- Files touched: `src/routes/coming-soon.tsx`, `src/routes/contact.tsx`, any other file matching the old email, `src/routes/sitemap[.]xml.ts`, plus the specific layout files identified by the overflow measurement (candidates include `src/styles.css`, `src/routes/index.tsx`, `src/routes/tasks.index.tsx`, `src/routes/tasks.browse.tsx`).
- Overflow measurement runs headlessly against the local dev server; findings drive the edits rather than speculative CSS changes.
- Google submission uses the connected Search Console account: list verified properties first, then submit against the exact returned property identifier.
