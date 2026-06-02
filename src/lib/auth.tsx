import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type StoredAuth = { token: string | null; user: Record<string, unknown> | null };

interface AuthCtx extends StoredAuth {
  setAuth: (a: StoredAuth) => void;
  logout: () => void;
}

const KEY = "findam:auth";
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredAuth>({ token: null, user: null });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
  }, []);

  const setAuth = (a: StoredAuth) => {
    setState(a);
    try {
      localStorage.setItem(KEY, JSON.stringify(a));
    } catch {}
  };

  const logout = () => {
    setState({ token: null, user: null });
    try {
      localStorage.removeItem(KEY);
    } catch {}
  };

  return <Ctx.Provider value={{ ...state, setAuth, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}

/** Extract token from various API response shapes. */
export function pickToken(data: Record<string, unknown> | null | undefined): string | null {
  if (!data) return null;
  const candidates = [
    (data as any).token,
    (data as any).access_token,
    (data as any).accessToken,
    (data as any).data?.access_token,
    (data as any).data?.token,
  ];
  for (const c of candidates) if (typeof c === "string" && c) return c;
  return null;
}

/** Build a user object from the API response (Find-am returns user fields at root). */
export function pickUser(
  data: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!data) return null;
  const d: any = data;
  if (d.user) return d.user;
  if (d.data?.user) return d.data.user;
  const fromRoot: Record<string, unknown> = {};
  for (const k of ["user_id", "id", "name", "full_name", "email", "phone", "account_type"]) {
    if (d[k] !== undefined) fromRoot[k] = d[k];
  }
  return Object.keys(fromRoot).length ? fromRoot : null;
}
