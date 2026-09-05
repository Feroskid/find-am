import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://find-am.com";

interface SitemapEntry {
  path: string;
}

// Core public landing pages.
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

// Mirrors FALLBACK_CATEGORIES in src/lib/findtask-categories.ts (slugs only,
// so this server route does not pull the icon components into the bundle).
const TASK_CATEGORY_SLUGS = [
  "automotive",
  "home-services",
  "building-construction",
  "digital-tech",
  "delivery-courier",
  "cleaning",
  "health-wellness",
  "beauty-personal-care",
  "events-entertainment",
  "education-lessons",
  "business-admin",
  "legal-finance",
  "pet-care",
  "moving-storage",
  "gardening-outdoor",
  "fashion-alterations",
  "food-catering",
  "writing-content",
  "design-creative",
];

const CITIES = [
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
  "Kano",
  "Benin City",
  "Enugu",
];

// Job-title search landing pages.
const JOB_TITLES = [
  "Software Developer",
  "Accountant",
  "Customer Service",
  "Sales Executive",
  "Graphic Designer",
  "Frontend Engineer",
  "Backend Engineer",
  "Product Manager",
  "Data Analyst",
  "UI UX Designer",
  "Content Writer",
  "Social Media Manager",
  "Driver",
  "Teacher",
  "Nurse",
  "Pharmacist",
  "Electrician",
  "Plumber",
  "Chef",
  "Security Officer",
  "Receptionist",
  "Civil Engineer",
  "Digital Marketer",
  "Delivery Rider",
];

// The strongest titles, crossed with the biggest cities.
const CROSS_TITLES = JOB_TITLES.slice(0, 7);
const CROSS_CITIES = CITIES.slice(0, 7);

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[character] ?? character);
}

function searchPath(query: string) {
  return `/search?q=${encodeURIComponent(query.toLowerCase())}&page=1`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...STATIC_ENTRIES];

        // Task category facets.
        for (const slug of TASK_CATEGORY_SLUGS) {
          entries.push({ path: `/tasks/browse?category=${encodeURIComponent(slug)}` });
        }

        // City facets + remote.
        for (const city of CITIES) {
          entries.push({ path: `/tasks/browse?location=${encodeURIComponent(city)}` });
        }
        entries.push({ path: "/tasks/browse?is_remote=1" });

        // Job-title search landings.
        for (const title of JOB_TITLES) {
          entries.push({ path: searchPath(title) });
        }

        // Job-title x city search landings.
        for (const title of CROSS_TITLES) {
          for (const city of CROSS_CITIES) {
            entries.push({ path: searchPath(`${title} ${city}`) });
          }
        }

        // Community categories, read live from the public data.
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
