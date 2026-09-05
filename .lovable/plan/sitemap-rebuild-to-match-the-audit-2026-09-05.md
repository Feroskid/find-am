# Sitemap rebuild to match the audit

## What the audit asked for vs what the site has now

The audit was taken on 24 August, before the sitemap work. Two of its points are already done: `/sitemap.xml` now exists and answers, and `robots.txt` already carries the `Sitemap:` line.

What is still missing is the **size and shape** of the list. The audit expects about 110 addresses; the current one has 12 fixed pages plus the community categories — roughly 18. All the landing pages that would actually bring search traffic are absent.

## What gets added

Keeping the 12 core pages already listed (home, Find-task home, explore, browse, categories, live map, community, contact, privacy, terms, refund, FAQ), the list grows with:

- **Task category pages** — one browse address per task category (Automotive, Home Services, Digital & Tech, Cleaning, and the rest).
- **City pages** — one browse address per major Nigerian city (Lagos, Abuja, Port Harcourt, Ibadan, Kano, Benin City, Enugu), plus a remote-only page.
- **Job search landing pages** — one per popular job title (Software Developer, Accountant, Driver, Teacher, Electrician, and about twenty more).
- **Job title by city pages** — the strongest of those titles combined with the biggest cities, roughly fifty addresses.
- **Community category pages** — kept as they are, read live from the community data.

Anything private stays out, exactly as the audit says: sign-in, register, password reset, profile, dashboard, wallet, my tasks, post a task, coming soon, community sign-in/new/search, messages, admin, and individual task pages (they expire and would turn into dead links at scale).

## The three side notes in the audit

Those are separate from the sitemap, so I'm listing them rather than folding them in:

1. Address tags (canonical) are missing on most pages.
2. The share title on every page still reads the old "FindAm" wording.
3. There is no job listing structured data for Google Jobs.

Say the word and I'll do them next; this plan only covers the sitemap.

## Technical notes

- Keep the existing server route `src/routes/sitemap[.]xml.ts` (do not move to a static `public/sitemap.xml` — a static file cannot stay in sync with the community data).
- Add local constant lists in that file: `TASK_CATEGORY_SLUGS` sourced from `src/lib/findtask-categories.ts`, `CITIES`, `JOB_TITLES`, and a `TITLE_CITY` pairing set.
- Facet URLs follow the routes' real search params: `/tasks/browse?category=<slug>`, `/tasks/browse?location=<city>`, `/tasks/browse?is_remote=1`, and `/search?q=<title>` / `/search?q=<title>%20<city>` (matching `validateSearch` in `tasks.browse.tsx` and `search.tsx`).
- Deduplicate by path, XML-escape every `loc` (ampersands in facet URLs must become `&amp;`), keep `Cache-Control: public, max-age=3600`, no `lastmod` (no page-specific timestamp exists).
- Community categories continue through the anonymous publishable-key client with the `apikey` header.
- Verify by requesting `/sitemap.xml` locally and counting entries before publishing.

## After the build

I'll paste the full sitemap file contents into chat so you have the code, then publish so the live address serves the new list.
