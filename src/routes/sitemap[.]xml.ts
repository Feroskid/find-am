import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://find-am.com";

interface SitemapEntry {
  path: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/" },
  { path: "/tasks" },
  { path: "/explore" },
  { path: "/tasks/browse" },
  { path: "/tasks/categories" },
  { path: "/map" },
  { path: "/community" },
  { path: "/contact" },
  { path: "/privacy" },
  { path: "/terms" },
  { path: "/refund" },
  { path: "/faq" },
];

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    "\"": "&quot;",
  })[character] ?? character);
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [...STATIC_ENTRIES];

        try {
          const { createClient } = await import("@supabase/supabase-js");
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
          const url = process.env["SUPABASE_URL"];
          if (key && url) {
            const supabase = createClient(url, key, {
              auth: { persistSession: false, autoRefreshToken: false },
              global: {
                fetch: (input, init) => {
                  const headers = new Headers(init?.headers);
                  if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
                    headers.delete("Authorization");
                  }
                  headers.set("apikey", key);
                  return fetch(input, { ...init, headers });
                },
              },
            });
            const { data } = await (supabase.from as any)("community_categories")
              .select("slug")
              .order("sort_order", { ascending: true })
              .limit(100);
            for (const category of data ?? []) {
              if (typeof category.slug === "string" && category.slug.length > 0) {
                entries.push({ path: `/community/c/${encodeURIComponent(category.slug)}` });
              }
            }
          }
        } catch {
          // The stable public URLs remain available even if optional category data is unavailable.
        }

        const uniqueEntries = Array.from(new Map(entries.map((entry) => [entry.path, entry])).values());
        const urls = uniqueEntries.map(({ path }) => [
          "  <url>",
          `    <loc>${escapeXml(`${BASE_URL}${path}`)}</loc>`,
          "  </url>",
        ].join("\n"));
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls,
          "</urlset>",
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});