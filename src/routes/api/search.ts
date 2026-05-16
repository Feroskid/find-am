import { createFileRoute } from "@tanstack/react-router";

const BACKEND = "http://167.71.4.178:8000";

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const incoming = new URL(request.url);
        const target = new URL(`${BACKEND}/search`);
        incoming.searchParams.forEach((v, k) => target.searchParams.set(k, v));

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
          return new Response(
            JSON.stringify({
              error: "Upstream request failed",
              message: err instanceof Error ? err.message : String(err),
            }),
            { status: 502, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
