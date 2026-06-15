
# Airtasker-style redesign of Find-task

Goal: re-skin and restructure the Find-task surface (home, browse, task detail, my tasks, tasker dashboard, header/menu) to closely mirror Airtasker's information architecture and visual hierarchy — while keeping our Find-task purple brand and the floating Dynamic Island (Find-Am ⇄ Find-task) intact.

We are NOT touching backend, server functions, schema, auth flow, or business logic. This is presentation-only.

---

## 1. Brand & design tokens

- Keep primary purple as-is for Find-task brand identity. Airtasker's blue is replaced by our purple wherever they use brand-blue (logo, primary CTAs, active tab pill, link color).
- Adopt Airtasker's structural cues in `src/styles.css`:
  - Deep navy/ink heading color (`--ink: oklch(0.18 0.04 265)`) for big bold display headings.
  - Soft warm background surfaces (`--surface-soft`) for cards and panels.
  - Heavier, condensed display font for hero headlines (Airtasker uses a tall condensed serif/sans — we'll use a free Google equivalent like **Archivo Black** or **Anton** for display, **Inter** for body), loaded via `<link>` in `__root.tsx` per Tailwind-v4 rules.
  - Fully rounded pill buttons, soft shadows, generous whitespace.
- Update `src/components/FindAmIsland.tsx` only to ensure the active pill uses the new purple token — keep position, animation, and routing identical.

## 2. Header & navigation (`src/components/TaskHeader.tsx`)

Match Airtasker's header shape:
- Hamburger menu (left) → opens a full slide-over with grouped sections: Browse tasks, Categories, Live map, Community, Become a Tasker, Help, Account.
- Centered wordmark "Find-task" in display font, purple.
- Right-side round purple **+** button = quick "Post a task" CTA (replacing the current text button on mobile).
- Desktop: keep the existing nav links but restyle as Airtasker (uppercase tracking, underline-on-hover), and keep the Dynamic Island row above the header exactly as today.
- Verify-email banner stays above the header.

## 3. Home / `src/routes/tasks.tsx` (Find-task landing)

Rebuild as a faithful Airtasker landing clone:
1. **Hero**: huge bold "GET ANYTHING DONE" headline (display font, ink color), subcopy, two CTAs (purple "Post your task for free", outline "Earn money as a Tasker"), trust strip (1M+ customers, secure payments, 4.0 Great).
2. **Membership band**: warm pastel section — "Unlock ₦0 connection fees all year round" with "Join now" button.
3. **Post in seconds** 3-step block (Describe → Set budget → Receive offers).
4. **Top categories** grid (Removals, Cleaning, Furniture assembly, Deliveries, Gardening, …) — large rounded cards with icon + label, linking to `/tasks/browse?category_id=`.
5. **See what others are getting done** tabbed showcase (Moving in / Home maintenance / Starting a business / Parties / Something different) with sample task cards (price, category chip, stars).
6. **Trust & safety** trio (Secure payments / Ratings & reviews / Insurance).
7. **Be your own boss** section for taskers with earnings mock-card and bullets.
8. **Featured taskers** (2 cards) using existing avatar/review data shape.
9. **Articles / Cost guides** placeholder block.
10. New `Footer` is already present — extend with Discover / Company / Existing Users / Popular Categories / Popular Locations columns and app-store badges (text-only placeholders).

## 4. Browse tasks / `src/routes/tasks.browse.tsx` (and `explore.tsx`)

Adopt Airtasker's two-pane "list + map" layout on desktop:
- Sticky filter bar (Search, Category dropdown ("X & N more"), Remote tasks only toggle, Budget range "₦5 – ₦500", Distance, Sort).
- Left column: scrollable task cards (title • $price right-aligned • Remote/Location chip • date chip • status pill "Open • 8 offers" / "Assigned" / "Completed" with the right color) — visually identical to Airtasker.
- Right column: live Leaflet map (we already have `LiveTasksMap`) showing pins for the visible list; clicking a card highlights the pin.
- Mobile: list only, with a "Map" toggle button that opens the map fullscreen.

## 5. Task detail / `src/routes/tasks.$taskId.tsx`

Match Airtasker task detail:
- Status pill row: OPEN / ASSIGNED / COMPLETED + Follow heart.
- Huge bold title.
- "Return to map" backlink.
- Meta block (Posted by / Location with View map link / To be done on).
- Right-side **Task Budget** card with big amount and full-width purple "Make an offer" / "Apply" CTA, plus "More options" accordion.
- Tabs row: **Offers (n)** / **Questions (n)** styled as the dark pill switcher.
- Offer/comment cards: avatar, name with verified badge, rating + completion rate, "Rebooked N times" chip, message bubble, "View replies" + relative time.
- Sticky bottom mini-summary bar on mobile (task title • date • Remote • $budget • Make an offer button) — matches uploaded screenshots exactly.
- Cancellation policy block at the bottom.

## 6. My tasks / new `src/routes/tasks.mine.tsx`

Add a dedicated "My tasks" route (linked from the menu and dashboard) that mirrors Airtasker's empty + populated states:
- Search bar + "All tasks" filter dropdown.
- Empty state: "You haven't posted any tasks yet — Post a task" CTA.
- Populated: same card style as Browse.

## 7. Tasker Dashboard / `src/routes/dashboard.tsx` (Tasker mode)

Add Airtasker's signature **Tier progress** panel at the top of Tasker mode:
- "YOUR CURRENT TIER: Bronze — 20% service fee" / "YOUR NEXT TIER: Silver 🔒 — 18.5%".
- "Your Earnings (last 30 days)" progress bar with milestone ticks (₦0 / ₦880 / ₦2,650 / ₦5,300+) and copy "Your earnings are ₦X away from Silver and lowering service fees."
- "How do tiers work?" link.
- Keep existing KPI cards and recommended-tasks list below, restyled to Airtasker card aesthetic (rounded-2xl, soft borders, ink headings).

Poster mode dashboard gets the same card restyle but keeps current KPIs.

## 8. Menu / Slide-over

New `src/components/MainMenu.tsx` (Sheet) opened by the hamburger:
- Account header (avatar, name, "View profile").
- Groups: Tasks (Browse, My tasks, Post a task), Discover (Categories, Map, Community), Account (Dashboard, Wallet, Messages, Notifications, Profile), Support (Help, Terms), Log out.

## 9. Out of scope (not touched this turn)

- Backend functions, schemas, server routes, auth, payments.
- Live map data source.
- E2EE chat logic.
- Existing categories backend; we only restyle the category page cards.

---

## Files to create
- `src/components/MainMenu.tsx` — hamburger slide-over.
- `src/components/TierProgress.tsx` — Airtasker tier bar for Tasker dashboard.
- `src/components/airtasker/HeroBand.tsx`, `MembershipBand.tsx`, `HowItWorks.tsx`, `CategoryGrid.tsx`, `ShowcaseTabs.tsx`, `TrustSafety.tsx`, `EarnAsTasker.tsx`, `FeaturedTaskers.tsx`, `ArticlesBlock.tsx` — landing sections.
- `src/routes/tasks.mine.tsx` — My tasks page.

## Files to edit
- `src/styles.css` — add ink color, surface-soft, display font tokens.
- `src/routes/__root.tsx` — `<link>` for the display Google font.
- `src/components/TaskHeader.tsx` — restructure header, add hamburger + round-plus CTA.
- `src/components/FindAmIsland.tsx` — verify purple active state.
- `src/components/Footer.tsx` — Airtasker-style multi-column footer.
- `src/routes/tasks.tsx` — replace with composed landing sections.
- `src/routes/tasks.browse.tsx` — list+map two-pane layout.
- `src/routes/tasks.$taskId.tsx` — Airtasker task detail layout (offers/questions tabs, sticky bottom bar, budget card).
- `src/routes/dashboard.tsx` — add TierProgress to Tasker mode, restyle cards.
- `src/routes/tasks.categories.tsx` — adopt new card aesthetic.

## Notes
- Purple primary token stays. Anywhere a screenshot shows Airtasker blue, we use our purple.
- All animations subtle (hover lift, fade-in); no new heavy deps.
- Mobile-first; verify the sticky bottom CTA bar on `/tasks/$taskId` against the uploaded mobile screenshots.
