import { createServerFn } from "@tanstack/react-start";

export type NewsItem = { title: string; link: string; summary: string; image: string | null; category: string; date: string | null };

let cache: { at: number; items: NewsItem[] } | null = null;

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&nbsp;/g, " ");
const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]).trim() : "";
};
const strip = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export const getNewsFeed = createServerFn({ method: "GET" }).handler(async (): Promise<{ items: NewsItem[] }> => {
  if (cache && Date.now() - cache.at < 3600_000) return { items: cache.items };
  try {
    const res = await fetch("https://singularityhub.com/feed", { headers: { "User-Agent": "Find-am news reader" } });
    if (!res.ok) throw new Error(`feed ${res.status}`);
    const xml = await res.text();
    const items = (xml.match(/<item>[\s\S]*?<\/item>/g) ?? []).slice(0, 6).map((it) => {
      const content = tag(it, "content:encoded") || tag(it, "description");
      const img =
        it.match(/<media:content[^>]*url="([^"]+)"/i)?.[1] ??
        it.match(/<enclosure[^>]*url="([^"]+)"/i)?.[1] ??
        content.match(/<img[^>]*src="([^"]+)"/i)?.[1] ?? null;
      const summary = strip(tag(it, "description"));
      return {
        title: strip(tag(it, "title")),
        link: tag(it, "link"),
        summary: summary.length > 180 ? summary.slice(0, 177) + "…" : summary,
        image: img,
        category: strip(tag(it, "category")) || "NEWS",
        date: tag(it, "pubDate") || null,
      };
    }).filter((i) => i.title && /^https?:\/\//.test(i.link));
    cache = { at: Date.now(), items };
    return { items };
  } catch (e: any) {
    console.error("news feed failed", e?.message ?? e);
    return { items: cache?.items ?? [] };
  }
});
