# FAQ, company registration details, and sitemap SEO

## 1. Build the FAQ page
- Add a public `/faq` route using the uploaded `Find-am-FAQ.md` as the source content.
- Organize the questions under the document's existing topics (trust, money, safety, disputes, using Find-am, Taskers, milestones, and Find-am jobs) in an accessible expandable FAQ layout.
- Add page-specific title, description, Open Graph metadata, Twitter card metadata, and a self-referencing canonical URL.
- Link the FAQ from the shared footer and the main menu so visitors can discover it.

## 2. Show the RC number everywhere the footer is used
- Add `RC Number: 9598372` to the shared Find-task footer beside the Integer Tech Ltd registration/copyright line.
- Add the same registration detail to the homepage's custom footer, which does not currently render the shared footer component.

## 3. Make sitemap and robots SEO-ready
- Add a server-backed `/sitemap.xml` route because the project currently has no sitemap implementation.
- Build the sitemap from the current public, indexable route inventory and include the new `/faq` page, core discovery pages, legal pages, and public community/category pages whose content source is available.
- Exclude authentication, account, admin, payment/callback, private messaging/workspace, tasker/poster workflow, and individual task-detail URLs as directed by the uploaded audit; do not invent stale or unsupported URL variants from the PDF.
- Use `https://find-am.com` as the sitemap base URL, XML escaping, correct response headers, and caching.
- Create/update `public/robots.txt` with crawler access for public pages and `Sitemap: https://find-am.com/sitemap.xml`.
- Add `noindex` metadata to clearly private/authenticated surfaces where it is missing, while preserving existing public page behavior.

## Technical notes
- Files expected: new `src/routes/faq.tsx`, new `src/routes/sitemap[.]xml.ts`, `public/robots.txt`, `src/components/Footer.tsx`, `src/routes/index.tsx`, and the relevant navigation component.
- Keep the original FAQ markdown as user-provided content, without exposing the uploaded file as a download unless needed; render its questions as page content.
- Verify the FAQ route, footer registration text, and `/sitemap.xml` output against the live preview after implementation.