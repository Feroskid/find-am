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

/** Extract token from various possible API response shapes. */
export function pickToken(data: Record<string, unknown> | null | undefined): string | null {
  if (!data) return null;
  const candidates = [
    (data as any).access_token,
    (data as any).token,
    (data as any).accessToken,
    (data as any).data?.access_token,
    (data as any).data?.token,
  ];
  for (const c of candidates) if (typeof c === "string" && c) return c;
  return null;
}

export function pickUser(data: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!data) return null;
  return ((data as any).user || (data as any).data?.user || null) as any;
}
