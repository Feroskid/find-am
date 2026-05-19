import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, ScanLine, TrendingUp } from "lucide-react";
import { FindAmLogo } from "@/components/FindAmLogo";
import { LanguageMenu } from "@/components/LanguageMenu";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { useI18n } from "@/lib/i18n";
import { track } from "@/lib/track";
import bgMask from "@/assets/bg-mask.jpeg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Find-Am — Find Jobs Across Nigeria" },
      {
        name: "description",
        content:
          "Find-Am is a search engine for jobs across Nigeria. You need work?… try Find-Am.",
      },
    ],
  }),
  component: Home,
});

const TRENDING = [
  "Software Developer",
  "Accountant",
  "Customer Service",
  "Sales Executive",
  "Graphic Designer",
  "Remote Marketing",
];

function Home() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [q, setQ] = useState("");

  // Show background ~50% of the time, randomly per visit
  const showBg = useMemo(() => Math.random() < 0.5, []);

  useEffect(() => {
    track({ action_type: "page_view", search_query: "home" });
  }, []);

  const go = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    track({ action_type: "search", search_query: trimmed });
    navigate({ to: "/search", search: { q: trimmed, page: 1 } });
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      {showBg && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 bg-center bg-cover opacity-[0.035] dark:opacity-[0.05]"
          style={{ backgroundImage: `url(${bgMask})` }}
        />
      )}

      <div className="relative flex-1 flex flex-col">
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 gap-3">
          <Link to="/" className="shrink-0">
            <FindAmLogo size="text-xl sm:text-2xl" />
          </Link>
          <div className="flex-1" />
          <LanguageMenu />
        </header>

        <main className="flex-1 flex flex-col items-center px-4 pt-12 sm:pt-16">
          <FindAmLogo size="text-6xl md:text-7xl" />
          <p className="mt-3 text-sm text-muted-foreground text-center">{t.tagline}</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              go(q);
            }}
            className="w-full max-w-2xl mt-10"
          >
            <div className="flex items-center gap-2 px-4 py-3 rounded-full border border-border bg-card/90 backdrop-blur shadow-sm hover:shadow-md focus-within:shadow-md transition-shadow">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="flex-1 bg-transparent outline-none text-base min-w-0"
              />
              <VoiceSearchButton onResult={(text) => { setQ(text); go(text); }} />
              <button
                type="button"
                aria-label="Search by image"
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                onClick={() => track({ action_type: "lens_click" })}
              >
                <ScanLine className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Trending */}
          <section className="w-full max-w-2xl mt-10">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" /> {t.trending}
            </div>
            <ul className="divide-y divide-border rounded-xl border border-border bg-card/70 backdrop-blur overflow-hidden">
              {TRENDING.map((item) => (
                <li key={item}>
                  <Link
                    to="/search"
                    search={{ q: item.toLowerCase(), page: 1 }}
                    onClick={() =>
                      track({ action_type: "trending_click", search_query: item })
                    }
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors"
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-foreground">{item}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </main>

        <footer className="mt-auto bg-primary-soft/60 px-6 py-4 flex flex-wrap justify-between text-sm text-muted-foreground">
          <div className="flex gap-6">
            <span>{t.footerAbout}</span>
            <span>{t.advertising}</span>
            <span>{t.business}</span>
          </div>
          <div className="flex gap-6">
            <span>{t.privacy}</span>
            <span>{t.terms}</span>
            <span>{t.settings}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
