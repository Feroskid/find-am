import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search, MapPin, Briefcase, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { searchJobs, type SearchResponse } from "@/lib/api";

type SearchParams = { q: string; page?: number; lucky?: number };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: String(s.q ?? ""),
    page: s.page ? Number(s.page) : 1,
    lucky: s.lucky ? Number(s.lucky) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search — Find-Am" },
      { name: "description", content: "Job search results on Find-Am." },
    ],
  }),
  component: SearchPage,
});

const LIMIT = 10;

function SearchPage() {
  const { q, page = 1, lucky } = Route.useSearch();
  const navigate = useNavigate();
  const [input, setInput] = useState(q);

  useEffect(() => setInput(q), [q]);

  const { data, isLoading, isError, error } = useQuery<SearchResponse>({
    queryKey: ["search", q, page],
    queryFn: () => searchJobs({ q, page, limit: LIMIT }),
    enabled: !!q,
  });

  // I'm Feeling Lucky: redirect to first result
  useEffect(() => {
    if (lucky && data?.results?.[0]?.website_url) {
      window.location.href = data.results[0].website_url;
    }
  }, [lucky, data]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = input.trim();
    if (!next) return;
    navigate({ to: "/search", search: { q: next, page: 1 } });
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;
  const goto = (p: number) => navigate({ to: "/search", search: { q, page: p } });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-6 px-6 py-4">
          <Link to="/" className="text-2xl font-extrabold text-primary shrink-0">Find-Am</Link>
          <form onSubmit={submit} className="flex-1 max-w-2xl">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full border border-border bg-card shadow-sm hover:shadow transition-shadow">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search jobs…"
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <button type="submit" className="text-primary text-sm font-medium">Go</button>
            </div>
          </form>
        </div>
      </header>

      <main className="max-w-3xl px-6 py-6 mx-0">
        {q && data && (
          <p className="text-xs text-muted-foreground mb-4">
            About <span className="font-medium text-foreground">{data.total.toLocaleString()}</span> results · page {data.page} of {totalPages}
          </p>
        )}

        {isLoading && (
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-3 w-1/3 bg-muted rounded" />
                <div className="h-5 w-3/4 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-sm">
            Couldn't load results: {(error as Error).message}
          </div>
        )}

        {!isLoading && data && data.results.length === 0 && (
          <div className="text-sm text-muted-foreground">No jobs found for "{q}". Try a different keyword.</div>
        )}

        <ol className="space-y-7">
          {data?.results.map((job) => (
            <li key={job.job_id} className="group">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">{job.company}</span>
                <span>›</span>
                <span className="truncate">{new URL(job.website_url).hostname}</span>
              </div>
              <a
                href={job.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-1 text-xl text-primary group-hover:underline font-medium"
              >
                {job.job_title}
                <ExternalLink className="inline h-3.5 w-3.5 ml-1 opacity-60" />
              </a>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.company}</span>
                {job.location && job.location !== "Not found" && (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                )}
                <span>Posted {job.posting_date}</span>
                {job.tag && <span className="px-1.5 py-0.5 rounded bg-primary-soft text-primary font-medium">{job.tag}</span>}
              </div>
              {job.keyword_tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {job.keyword_tags.slice(0, 6).map((t) => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>

        {data && totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onGo={goto} />
        )}
      </main>
    </div>
  );
}

function Pagination({ page, totalPages, onGo }: { page: number; totalPages: number; onGo: (p: number) => void }) {
  const window = 5;
  const start = Math.max(1, page - Math.floor(window / 2));
  const end = Math.min(totalPages, start + window - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1 text-sm">
      <button
        disabled={page <= 1}
        onClick={() => onGo(page - 1)}
        className="p-2 rounded-md hover:bg-muted disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onGo(1)} className="px-3 py-1.5 rounded-md hover:bg-muted">1</button>
          {start > 2 && <span className="px-1 text-muted-foreground">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onGo(p)}
          className={`px-3 py-1.5 rounded-md font-medium ${p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-muted-foreground">…</span>}
          <button onClick={() => onGo(totalPages)} className="px-3 py-1.5 rounded-md hover:bg-muted">{totalPages}</button>
        </>
      )}
      <button
        disabled={page >= totalPages}
        onClick={() => onGo(page + 1)}
        className="p-2 rounded-md hover:bg-muted disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
