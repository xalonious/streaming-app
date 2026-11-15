import "server-only";
import type { MediaType } from "../../../api/tmdb";
import { getDatabase } from "../db/connection";
import { getMovieDetails, getTvDetails } from "../tmdbService";
import { normalizeSearchResult } from "../tmdbTransforms";
import { WatchlistRepository } from "./repository";

const watchlist = () => new WatchlistRepository(getDatabase());

export function listWatchlist() {
  return { results: watchlist().list() };
}

export async function saveWatchlistTitle(type: MediaType, id: number) {
  const details = await (type === "movie" ? getMovieDetails(id) : getTvDetails(id));
  watchlist().save(normalizeSearchResult({ ...details, id, media_type: type }));
  return listWatchlist();
}

export function removeWatchlistTitle(type: MediaType, id: number) {
  watchlist().delete(type, id);
  return listWatchlist();
}
