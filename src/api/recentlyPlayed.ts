import type { MediaType, SearchResult } from "./tmdb";

async function recentlyPlayedRequest(path = "", method = "GET"): Promise<SearchResult[]> {
  const response = await fetch(`/api/recently-played${path}`, { method, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Recently played request failed");
  return data.results;
}

export const listRecentlyPlayed = () => recentlyPlayedRequest();
export const recordRecentlyPlayed = (type: MediaType, id: number) => recentlyPlayedRequest(`/${type}/${id}`, "PUT");
