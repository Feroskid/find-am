import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(t);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default to light for new users; on mount we read localStorage.
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    let initial: Theme = "light";
    try {
      const stored = localStorage.getItem("findam:theme") as Theme | null;
      if (stored === "light" || stored === "dark") initial = stored;
    } catch {}
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    try {
      localStorage.setItem("findam:theme", t);
    } catch {}
  };

  return (
    <Ctx.Provider value={{ theme, setTheme, toggle: () => setTheme(theme === "light" ? "dark" : "light") }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme must be used inside ThemeProvider");
  return c;
}
