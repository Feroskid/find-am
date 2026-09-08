import { createFileRoute } from "@tanstack/react-router";

const BODY = `User-agent: *
Disallow: /admin
Disallow: /dashboard
Disallow: /messages
Disallow: /wallet
Disallow: /settings
Disallow: /auth
Disallow: /listings/

Sitemap: https://find-am.com/sitemap.xml
`;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(BODY, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        }),
    },
  },
});
