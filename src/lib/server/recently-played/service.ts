import "server-only";
import type { MediaType } from "../../../api/tmdb";
import { getDatabase } from "../db/connection";
import { getMovieDetails, getTvDetails } from "../tmdbService";
import { normalizeSearchResult } from "../tmdbTransforms";
import { RecentlyPlayedRepository } from "./repository";

export function listRecentlyPlayed() {
  return { results: new RecentlyPlayedRepository(getDatabase()).list() };
}

export async function recordRecentlyPlayed(type: MediaType, id: number) {
  const playedAt = Date.now();
  const details = await (type === "movie" ? getMovieDetails(id) : getTvDetails(id));
  new RecentlyPlayedRepository(getDatabase()).record(normalizeSearchResult({ ...details, id, media_type: type }), playedAt);
  return listRecentlyPlayed();
}
