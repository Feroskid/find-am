import { createFileRoute } from "@tanstack/react-router";

// Configurable via env (set BACKEND_SEARCH_URL in Wrangler secrets to override).
// Defaults to the HTTPS-fronted Find-Am API to avoid plaintext transport.
const DEFAULT_BACKEND = "https://api.find-am.com";

// Explicit allowlist of forwarded query parameters. Anything else is dropped.
const ALLOWED_PARAMS: Record<string, (v: string) => string | null> = {
  q: (v) => v.slice(0, 200),
  category_id: (v) => (/^[\w-]{1,64}$/.test(v) ? v : null),
  location: (v) => v.slice(0, 100),
  is_remote: (v) => (v === "true" || v === "false" ? v : null),
  job_type: (v) => v.slice(0, 100),
  sort: (v) => (/^[\w-]{1,32}$/.test(v) ? v : null),
  page: (v) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) && n >= 1 && n <= 1000 ? String(n) : null;
  },
  limit: (v) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) && n >= 1 && n <= 100 ? String(n) : null;
  },
  min_budget: (v) => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) && n >= 0 && n <= 1e9 ? String(n) : null;
  },
  max_budget: (v) => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) && n >= 0 && n <= 1e9 ? String(n) : null;
  },
};

export const Route = createFileRoute("/api/public/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const backend = (process.env.BACKEND_SEARCH_URL ?? DEFAULT_BACKEND).replace(/\/+$/, "");
        const incoming = new URL(request.url);
        const target = new URL(`${backend}/search`);

        for (const [key, value] of incoming.searchParams.entries()) {
          const sanitizer = ALLOWED_PARAMS[key];
          if (!sanitizer) continue;
          const safe = sanitizer(value);
          if (safe !== null) target.searchParams.set(key, safe);
        }

        try {
          const upstream = await fetch(target.toString(), {
            headers: { accept: "application/json" },
          });
          const body = await upstream.text();
          return new Response(body, {
            status: upstream.status,
            headers: {
              "content-type":
                upstream.headers.get("content-type") ?? "application/json",
              "cache-control": "no-store",
            },
          });
        } catch (err) {
          // Log details server-side, return generic message to client.
          console.error("search proxy upstream failure", err);
          return new Response(
            JSON.stringify({ error: "Upstream unavailable" }),
            { status: 502, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
