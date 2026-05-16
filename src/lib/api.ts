export const API_BASE = "http://167.71.4.178:8000";

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

export async function searchJobs(params: {
  q: string;
  page?: number;
  limit?: number;
  location?: string;
  job_type?: string;
}): Promise<SearchResponse> {
  const url = new URL(`${API_BASE}/search`);
  url.searchParams.set("q", params.q);
  url.searchParams.set("page", String(params.page ?? 1));
  url.searchParams.set("limit", String(params.limit ?? 10));
  if (params.location) url.searchParams.set("location", params.location);
  if (params.job_type) url.searchParams.set("job_type", params.job_type);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
}
