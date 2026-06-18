import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppMode = "poster" | "tasker";

type StoredAuth = { token: string | null; user: Record<string, unknown> | null; mode?: AppMode };

interface AuthCtx {
  token: string | null;
  user: Record<string, unknown> | null;
  mode: AppMode;
  setAuth: (a: { token: string | null; user: Record<string, unknown> | null }) => void;
  setMode: (m: AppMode) => void;
  logout: () => void;
}

const KEY = "findam:auth";
const MODE_KEY = "findam:mode";
const Ctx = createContext<AuthCtx | null>(null);

function readInitialAuth(): StoredAuth {
  if (typeof window === "undefined") return { token: null, user: null };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { token: null, user: null };
}

function readInitialMode(): AppMode {
  if (typeof window === "undefined") return "poster";
  try {
    const m = window.localStorage.getItem(MODE_KEY) as AppMode | null;
    if (m === "poster" || m === "tasker") return m;
  } catch {}
  return "poster";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lazy init so the first client render already sees the persisted session.
  // Without this, protected pages momentarily see token=null and bounce to
  // /login, which then redirects logged-in users back to /dashboard.
  const [state, setState] = useState<StoredAuth>(readInitialAuth);
  const [mode, setModeState] = useState<AppMode>(readInitialMode);

  // Re-sync after mount in case SSR rendered with empty defaults.
  useEffect(() => {
    const next = readInitialAuth();
    if (next.token !== state.token) setState(next);
    const m = readInitialMode();
    if (m !== mode) setModeState(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAuth = (a: { token: string | null; user: Record<string, unknown> | null }) => {
    setState(a);
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch {}
  };

  const setMode = (m: AppMode) => {
    setModeState(m);
    try { localStorage.setItem(MODE_KEY, m); } catch {}
  };

  const logout = () => {
    setState({ token: null, user: null });
    try { localStorage.removeItem(KEY); } catch {}
  };

  return (
    <Ctx.Provider value={{ token: state.token, user: state.user, mode, setAuth, setMode, logout }}>
      {children}
    </Ctx.Provider>
  );
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
  for (const k of ["user_id", "id", "name", "full_name", "email", "phone", "account_type", "photo_url", "location", "tagline", "about"]) {
    if (d[k] !== undefined) fromRoot[k] = d[k];
  }
  return Object.keys(fromRoot).length ? fromRoot : null;
}
