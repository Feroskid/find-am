import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { verifyAdminAccess } from "@/lib/support.functions";

export type AdminInfo = { name: string; email: string; userId: string | number };

/**
 * Confirms with the backend that the signed-in account has admin access.
 * Returns `checking` while the check is in flight.
 */
export function useAdminGate(token: string | null | undefined, ready: boolean) {
  const verify = useServerFn(verifyAdminAccess);
  const [state, setState] = useState<{ checking: boolean; isAdmin: boolean; admin: AdminInfo | null; error: string | null }>({
    checking: true,
    isAdmin: false,
    admin: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (!ready) return;
    if (!token) {
      setState({ checking: false, isAdmin: false, admin: null, error: "Not signed in" });
      return;
    }
    setState((s) => ({ ...s, checking: true }));
    verify({ data: { token } })
      .then((r: any) => {
        if (cancelled) return;
        if (r?.ok) setState({ checking: false, isAdmin: true, admin: r.admin, error: null });
        else setState({ checking: false, isAdmin: false, admin: null, error: r?.error ?? "Access denied" });
      })
      .catch((e: any) => {
        if (!cancelled) setState({ checking: false, isAdmin: false, admin: null, error: e?.message ?? "Access denied" });
      });
    return () => {
      cancelled = true;
    };
  }, [token, ready, verify]);

  return state;
}
