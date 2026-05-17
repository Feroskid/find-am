import { searchJobsServer, type SearchJobsInput } from "./search.functions";

// Search is executed through a TanStack server function so the browser never
// calls the HTTP backend or the preview-only /api/public route directly.
export const API_BASE = "server-function";

export interface JobResult {
  job_id: number;
  job_title: string;
  company: string;
  location: string;
  posting_date: string;
  tag: string | null;
  keyword_tags: string[];
  website_url: string;
  status: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  page: number;
  limit: number;
  results: JobResult[];
}

export async function searchJobs(params: SearchJobsInput): Promise<SearchResponse> {
  return searchJobsServer({
    data: {
      q: params.q,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      location: params.location,
      job_type: params.job_type,
    },
  });
}
