
# Backend ↔ Frontend Alignment Plan

I pulled the live OpenAPI spec from `https://api.find-am.com/openapi.json` (61 endpoints) and compared it line-by-line to `src/lib/findtask.functions.ts` + `auth.functions.ts` and every route under `src/routes/`. Below are the real gaps and fixes, grouped by area.

## 1. Critical bugs in current wrappers

| Issue | Current code | What the API actually exposes |
|---|---|---|
| Payment flow | `initiateEscrow` → `POST /payments/escrow/{id}`; `verifyPayment` → `/payments/verify/{ref}` | **Neither path exists.** Real flow: posting a task (or accepting a tasker) returns a Flutterwave checkout URL; user is redirected back to `GET /task/payment/callback?tx_ref&transaction_id&status`. Webhook at `/webhook/flutterwave` is server-only. |
| `getUserTasks` | calls `/user/{id}/tasks` | **Not in spec.** Must use `GET /my-applications` (tasker) or filter `/task/search` by poster (poster) |
| `getUserRatings` | calls `/user/{id}/ratings` | **Not in spec.** Ratings come embedded in `/user/{id}/profile` |
| `createTask` body | sends `latitude`/`longitude` aliases and `has_milestones` | Spec uses **`location_lat`/`location_lng`** and **`is_milestone`** only |
| `applyToTask` body | only `message` | Spec also accepts **`earliest_start`** |
| `disputeTask` body | only `reason` | Spec also accepts **`evidence_urls[]`** |

## 2. Missing server-fn wrappers to add to `src/lib/findtask.functions.ts`

- `getMyApplications` → `GET /my-applications`
- `getMyConversations` → `GET /my-conversations`
- `listBanks` → `GET /banks`
- `verifyKyc` → `POST /wallet/verify-kyc` (bvn, bank_code, account_number)
- `registerBank` → `POST /auth/register-bank` (bank_code, account_number, account_name)
- `getMilestones` → `GET /task/{id}/milestones`
- `completeMilestone` → `POST /task/{id}/milestone/{mid}/complete`
- `releaseMilestone` → `POST /task/{id}/milestone/{mid}/release`
- `reportTask` → `POST /task/{id}/report`
- `recordLocation` → `POST /task/{id}/location` (raw ping; separate from `/location/toggle`)
- `paymentCallback` helper → calls `GET /task/payment/callback` from the redirect route

## 3. UI pages to redesign / create

Each maps directly to one or more endpoints above. Public-facing pages use the navy + purple Airtasker design tokens already in `styles.css`.

| Page (route) | Endpoints driving it | Work |
|---|---|---|
| `/tasks/offers` (new) | `GET /my-applications` | New **"My Offers / Assigned"** page for taskers — list of every offer the tasker submitted, with status badges (pending, accepted, declined) and links into the task |
| `/inbox` (new, replaces ad-hoc messages route) | `GET /my-conversations`, `GET/POST /task/{id}/messages` | Threaded inbox sidebar + workspace view. Click a thread → open task message panel |
| `/wallet` (redesign) | `GET /wallet/balance`, `POST /wallet/withdraw`, `GET /banks`, `POST /auth/register-bank`, `POST /wallet/verify-kyc` | Add bank picker, KYC modal (BVN), saved bank cards |
| `/post-task` (fix payload) | `POST /task/post` | Use correct `location_lat/lng`, `is_milestone`; show milestone editor when toggled |
| `/tasks/$taskId` (fix accept flow) | `PUT /task/{id}/accept/{tasker}` then redirect to Flutterwave URL returned by backend | Replace fake `initiateEscrow` modal with real redirect; surface checkout URL from response |
| `/tasks/payment/callback` (new route) | `GET /task/payment/callback` | Handle redirect from Flutterwave: read `tx_ref`/`transaction_id`/`status` from URL, ping callback, then route to task with toast |
| `/tasks/$taskId` (milestones tab) | `GET /task/{id}/milestones`, `POST .../complete`, `POST .../release` | Show milestone list; poster can release each; tasker can mark complete |
| `/tasks/$taskId` (report button) | `POST /task/{id}/report` | "Report task" link in sidebar with reason + description form |
| `/u/$userId` (fix) | `GET /user/{id}/profile` only | Drop `getUserRatings`/`getUserTasks` calls; surface ratings/tasks embedded in profile response |
| `/register` (account type) | `POST /auth/register` | Add `account_type` select (poster / tasker) per `UserRegister` schema |
| `/tasks/$taskId` (dispute) | `POST /task/{id}/dispute` | Add evidence URL inputs |
| `/tasks/$taskId/apply` form | `POST /task/{id}/apply` | Add optional `earliest_start` date input |

## 4. Verification step (after wrappers updated)

For each new/changed wrapper, hit it from the dev sandbox with curl (anon endpoints) or with the logged-in token (feroade7@gmail.com) and confirm:
- Status code 2xx
- Response envelope matches what the UI reads
- No `422` from field-name mismatches

Findings recorded inline in the wrapper file as JSDoc above each function.

## 5. Out of scope (admin-only — skipping)

All `/admin/*` endpoints (banned-keywords, blacklist, disputes, reports, freeze, ban, reactivate, audit-log, ledger) and `POST /webhook/flutterwave`. These are server-to-server or staff-tool surfaces and not part of the public UI.

## Technical notes

- Auth header continues to come from `useAuth().token`; no new auth surfaces needed.
- Payment redirect: backend already constructs Flutterwave URL; the frontend must (a) follow the URL returned from accept/post and (b) handle the GET callback route to finalize.
- `getUserTasks` fallback (search-then-filter) should be removed once `/my-applications` covers the tasker side; poster history can use the embedded data from `/user/{id}/profile` or a one-shot `/task/search?poster_id=` if the backend supports it (will probe during step 4 and degrade gracefully otherwise).

Once you approve, I'll start with section 1 (fix wrong wrappers) + section 2 (add missing wrappers), probe each one live, then move through the UI page list in section 3.
