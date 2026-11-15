import type { MediaType, SearchResult } from "./tmdb";

async function watchlistRequest(path = "", method = "GET"): Promise<SearchResult[]> {
  const response = await fetch(`/api/watchlist${path}`, { method, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Watchlist request failed");
  return data.results;
}

export const listWatchlist = () => watchlistRequest();
export const saveWatchlistTitle = (type: MediaType, id: number) => watchlistRequest(`/${type}/${id}`, "PUT");
export const removeWatchlistTitle = (type: MediaType, id: number) => watchlistRequest(`/${type}/${id}`, "DELETE");
