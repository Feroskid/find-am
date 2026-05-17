import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { SearchResponse } from "./api";

const BACKEND_SEARCH_URL = "http://167.71.4.178:8000/search";

const SearchInputSchema = z.object({
  q: z.string().trim().min(1).max(200),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  location: z.string().trim().max(100).optional(),
  job_type: z.string().trim().max(100).optional(),
});

export type SearchJobsInput = z.input<typeof SearchInputSchema>;

export const searchJobsServer = createServerFn({ method: "POST" })
  .inputValidator((input: SearchJobsInput) => SearchInputSchema.parse(input))
  .handler(async ({ data }): Promise<SearchResponse> => {
    const url = new URL(BACKEND_SEARCH_URL);
    url.searchParams.set("q", data.q);
    url.searchParams.set("page", String(data.page));
    url.searchParams.set("limit", String(data.limit));
    if (data.location) url.searchParams.set("location", data.location);
    if (data.job_type) url.searchParams.set("job_type", data.job_type);

    const upstream = await fetch(url.toString(), {
      headers: {
        accept: "application/json",
        "user-agent": "Find-Am/1.0 search proxy",
      },
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      throw new Error(
        `Search backend failed with ${upstream.status}: ${text.slice(0, 180)}`,
      );
    }

    return JSON.parse(text) as SearchResponse;
  });