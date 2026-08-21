# Admin console fixes: reports, user context, reasons, support filters

## 1. Reports "All" filter shows nothing
The backend treats the status value as a literal filter — there is no "all" option, so `?status=all` returns an empty list. Live check confirms the real values are `open`, `reviewed` and `dismissed` (there are currently 2 reviewed and 1 dismissed report, 0 open).

Fix: when "All" is selected, fetch the three real statuses and merge them into one list sorted newest-first, so All shows every report. The other tabs keep their single-status request.

## 2. User context cards are missing the real data
The context endpoint returns `user`, `posted_tasks`, `working_tasks`, `wallet { balance, frozen_amount }`, `open_disputes` and `warnings`. The current cards read keys the backend never sends (`tasks_posted`, `dispute_count`, `withdrawable_balance`), so they all show "—".

Rebuild the panel around the real payload:
- Header: name, email, phone, user ID, plus status chips (active / frozen, KYC verified, admin, trust score, joined and last-login dates).
- Stat cards: Tasks posted (count), Tasks working (count), Open disputes (count), Wallet balance, Frozen amount, Status, KYC, Trust score.
- Warnings shown as a highlighted list when present (e.g. "2 live task(s) posted").
- Two compact lists for posted and working tasks (title, status, budget, task link).
- Raw JSON stays available in the collapsed section.

## 3. Optional reason on Held funds
Add an optional "Reason for action" input to Held funds, sent with freeze/unfreeze and recorded in the on-page session log next to each action.

Note on the backend: the freeze-funds / unfreeze-funds endpoints currently accept no reason field, so the value is not stored server-side and will not appear in the audit log for fund actions. The UI will be built and the value passed; persisting it needs a backend change, which I'll flag as an API request.

## 4. Reason not appearing in the audit log
The audit entries carry the free text in a `details` field that is a plain string. The audit table reads `details.reason`, which is always undefined on a string — hence the permanent "—".

Fix: render `details` when it is a string (falling back to `details.reason` / `reason` / `note` for other shapes). Existing entries already prove this works — e.g. a dispute resolution shows "Refunded full task amount to employer wallet".

Second part: ban/freeze entries in the live log show `details: null` even where a reason was supplied, while the freeze endpoint does accept a `reason` body. After the render fix I'll perform one real freeze + reactivate on a test account with a reason and re-read the log. If the reason still lands as null, it is the backend dropping it and I'll report it as an API fix rather than pretend it works.

## 5. Support: drop "answered"
- Filter tabs become Open, Closed, All.
- Remove the "answered" status badge style and the "N answered" count chip in the support header.
- Remove "answered" from the ticket status update options.
- Admin overview: replace the "Answered tickets" stat with "Closed tickets" so the four-card row keeps its shape.

## Technical notes
- Files touched: `src/routes/admin.reports.tsx`, `src/routes/admin.users.tsx`, `src/routes/admin.funds.tsx`, `src/routes/admin.audit.tsx`, `src/routes/admin.support.tsx`, `src/routes/admin.index.tsx`, and `src/lib/findtask.functions.ts` (optional `reason` on the two fund functions).
- No database or schema changes.
