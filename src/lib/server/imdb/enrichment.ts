import "server-only";
import { getDatabase } from "../db/connection";
import { preferredRating, type RatedMedia } from "../../ratings";
import { lookupRatings, queueMappings, saveMapping, mappingRetention, type MediaIdentity } from "./mappings";

type Title = RatedMedia & { id: number; type?: string; media_type?: string; title?: string; imdb_id?: string | null; external_ids?: { imdb_id?: string | null } };
export function enrichRatings<T extends Title>(titles: T[], fallbackType?: "movie" | "tv", origin?: { path: string; params: Record<string, string> }): (T & { rating: ReturnType<typeof preferredRating> })[] {
  const db = getDatabase();
  const identities = titles.map(title => ({ id: title.id, type: fallbackType
    ?? (title.media_type === "movie" || title.media_type === "tv" ? title.media_type : undefined)
    ?? (title.type === "movie" || title.type === "tv" ? title.type : title.title ? "movie" : "tv") })) as MediaIdentity[];
  db.transaction(() => {
    titles.forEach((title, index) => {
      const id = title.imdb_id !== undefined ? title.imdb_id : title.external_ids?.imdb_id;
      if (id !== undefined) saveMapping(db, identities[index], id,
        origin ? mappingRetention(db, origin.path, origin.params) : undefined);
    });
  })();
  const rows = lookupRatings(db, identities);
  const found = new Map(rows.map(row => [`${row.media_type}:${row.tmdb_id}`, row]));
  const missing = identities.filter(title => !found.has(`${title.type}:${title.id}`));
  if (missing.length) queueMappings(missing);
  return titles.map((title, index) => {
    const identity = identities[index], row = found.get(`${identity.type}:${identity.id}`);
    const rating = row?.average_rating != null
      ? { value: row.average_rating, voteCount: row.vote_count, source: "imdb" as const }
      : preferredRating({ vote_average: title.vote_average, vote_count: title.vote_count });
    return { ...title, rating };
  });
}
