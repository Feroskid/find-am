import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

/**
 * Watches every react-query result and mutation result for an expired-session
 * signal (HTTP 401 or a matching "unauthorized" error message from server fns).
 * When it fires, we clear local auth state and bounce the user to /login,
 * preserving the current URL as ?next=… so they land back where they were.
 */
const PUBLIC_PATHS = [
  "/", "/login", "/register", "/reset-password", "/verify-email",
  "/auth/verify-email", "/privacy", "/terms", "/refund", "/contact",
];

function looksUnauthorized(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as any;
  if (p.ok === false && p.status === 401) return true;
  if (typeof p.error === "string" && /session (has )?expired|invalid token|not authenticated|could not validate credentials/i.test(p.error)) return true;
  return false;
}

export function SessionGuard() {
  const qc = useQueryClient();
  const router = useRouter();
  const { token, logout, ready } = useAuth();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!ready) return;
    firedRef.current = false;

    const trigger = () => {
      if (firedRef.current) return;
      // Only meaningful once the user actually had a session.
      if (!token) return;
      firedRef.current = true;
      try { logout(); } catch {}
      try { qc.clear(); } catch {}
      toast.error("Your session has expired. Please log in again.");
      const here = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      const isPublic = PUBLIC_PATHS.some((p) => here === p || here.startsWith(p + "?"));
      const next = isPublic ? "/" : here;
      router.navigate({ to: "/login", search: { next } as any, replace: true });
    };

    const unsubQ = qc.getQueryCache().subscribe((event: any) => {
      if (event?.type !== "updated") return;
      const data = event.query?.state?.data;
      const err = event.query?.state?.error;
      if (looksUnauthorized(data) || looksUnauthorized(err)) trigger();
    });
    const unsubM = qc.getMutationCache().subscribe((event: any) => {
      if (event?.type !== "updated") return;
      const data = event.mutation?.state?.data;
      const err = event.mutation?.state?.error;
      if (looksUnauthorized(data) || looksUnauthorized(err)) trigger();
    });
    return () => { unsubQ(); unsubM(); };
  }, [qc, router, token, logout, ready]);

  return null;
}
