## Plan

Update `src/components/SessionGuard.tsx` with two targeted edits:

1. Narrow the status-code check so only `401` triggers a session-expiry redirect (403 no longer does).
2. Tighten the error-message regex to a more specific set of phrases indicating true session expiry, avoiding false positives on generic "unauthorized" errors.

### Technical details

- **Edit A** — replace:
  ```ts
  if (p.ok === false && (p.status === 401 || p.status === 403)) return true;
  ```
  with:
  ```ts
  if (p.ok === false && p.status === 401) return true;
  ```

- **Edit B** — replace the current regex line (~line 22) that matches `/unauthori[sz]ed|session|expired|invalid token|not authenticated/i` with:
  ```ts
  if (typeof p.error === "string" && /session (has )?expired|invalid token|not authenticated|could not validate credentials/i.test(p.error)) return true;
  ```

No other logic, imports, or files are touched.