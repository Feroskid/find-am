import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Menu, Globe } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Find-Am — Find Jobs Across Africa" },
      { name: "description", content: "Find-Am is a search engine for jobs across Africa. Connecting talent to opportunity." },
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="text-sm text-muted-foreground">Find-Am · Jobs</div>
        <div className="flex-1 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full bg-foreground text-background p-1 shadow-lg">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              <Search className="h-4 w-4" /> Search
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium opacity-80 hover:opacity-100">
              Jobs
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-medium bg-primary-soft text-primary px-3 py-1.5 rounded-full">
            <Globe className="h-3.5 w-3.5" /> English
          </span>
          <button className="p-2 rounded-md hover:bg-muted"><Menu className="h-5 w-5" /></button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-4 pt-16">
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-primary">
          Find-Am
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Connecting Africa to opportunity</p>

        <form onSubmit={submit} className="w-full max-w-2xl mt-10">
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-full border border-border bg-card shadow-sm hover:shadow-md focus-within:shadow-md transition-shadow">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search jobs across Africa…"
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

        <p className="mt-10 text-sm text-muted-foreground">
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
  );
}
