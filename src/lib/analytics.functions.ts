import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const ANALYTICS_URL = "https://api.find-am.com/analytics/track";

const TrackInputSchema = z.object({
  action_type: z.string().min(1).max(64),
  listing_id: z.number().int().optional(),
  listing_id2: z.number().int().optional(),
  search_query: z.string().max(200).optional(),
  time_spent: z.number().int().optional(),
  device_type: z.enum(["desktop", "mobile", "tablet"]).optional(),
});

export type TrackInput = z.input<typeof TrackInputSchema>;

export const trackEventServer = createServerFn({ method: "POST" })
  .inputValidator((input: TrackInput) => TrackInputSchema.parse(input))
  .handler(async ({ data }) => {
    // Capture user IP / UA on the server so analytics gets real client data.
    const ip =
      getRequestHeader("cf-connecting-ip") ||
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
      getRequestHeader("x-real-ip") ||
      "";
    const ua = getRequestHeader("user-agent") || "";

    try {
      const res = await fetch(ANALYTICS_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          "x-forwarded-for": ip,
          "user-agent": ua || "Find-Am/1.0",
        },
        body: JSON.stringify({
          action_type: data.action_type,
          listing_id: data.listing_id ?? null,
          listing_id2: data.listing_id2 ?? null,
          search_query: data.search_query ?? "",
          time_spent: data.time_spent ?? 0,
          device_type: data.device_type ?? "desktop",
        }),
      });
      return { ok: res.ok, status: res.status };
    } catch (err) {
      // Never let analytics break the app.
      console.error("analytics track failed", err);
      return { ok: false, status: 0 };
    }
  });
