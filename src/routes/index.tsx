import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Menu } from "lucide-react";
import { FindAmLogo } from "@/components/FindAmLogo";
import { LanguageMenu } from "@/components/LanguageMenu";
import bgMask from "@/assets/bg-mask.jpeg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Find-Am — Find Jobs Across Nigeria" },
      { name: "description", content: "Find-Am is a search engine for jobs across Nigeria. You need work?… try Find-Am." },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    navigate({ to: "/search", search: { q: query, page: 1 } });
  };

  const lucky = () => {
    const query = q.trim() || "developer";
    navigate({ to: "/search", search: { q: query, page: 1, lucky: 1 } });
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      {/* Faint background image */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-center bg-no-repeat bg-contain opacity-[0.07] dark:opacity-[0.09]"
        style={{ backgroundImage: `url(${bgMask})` }}
      />

      <div className="relative flex-1 flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 gap-3">
          <Link to="/" className="shrink-0">
            <FindAmLogo size="text-xl sm:text-2xl" />
          </Link>
          <div className="flex-1 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full bg-foreground text-background p-0.5 sm:p-1 shadow-lg">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-medium">
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Search
              </button>
              <button className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium opacity-80 hover:opacity-100">
                Jobs
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LanguageMenu />
            <button className="p-2 rounded-md hover:bg-muted hidden sm:inline-flex"><Menu className="h-5 w-5" /></button>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center px-4 pt-16">
          <FindAmLogo size="text-6xl md:text-7xl" />
          <p className="mt-3 text-sm text-muted-foreground">you need work?… try Find-Am</p>

          <form onSubmit={submit} className="w-full max-w-2xl mt-10">
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-full border border-border bg-card/90 backdrop-blur shadow-sm hover:shadow-md focus-within:shadow-md transition-shadow">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search jobs across Nigeria…"
                className="flex-1 bg-transparent outline-none text-base"
              />
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button type="submit" className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                Search
              </button>
              <button type="button" onClick={lucky} className="px-6 py-2.5 rounded-full border border-border bg-card text-primary text-sm font-medium hover:bg-primary-soft">
                I'm Feeling Lucky
              </button>
            </div>
          </form>

          <p className="mt-10 text-sm text-muted-foreground text-center">
            Popular:{" "}
            {["Developer", "Designer", "Marketing", "Finance", "Remote"].map((t, i) => (
              <span key={t}>
                {i > 0 && " | "}
                <Link to="/search" search={{ q: t.toLowerCase(), page: 1 }} className="text-primary hover:underline font-medium">
                  {t}
                </Link>
              </span>
            ))}
          </p>
        </main>

        <footer className="mt-auto bg-primary-soft/60 px-6 py-4 flex flex-wrap justify-between text-sm text-muted-foreground">
          <div className="flex gap-6"><span>About</span><span>Advertising</span><span>Business</span></div>
          <div className="flex gap-6"><span>Privacy</span><span>Terms</span><span>Settings</span></div>
        </footer>
      </div>
    </div>
  );
}
