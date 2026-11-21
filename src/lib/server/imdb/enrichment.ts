import "server-only";
import { transaction } from "../db/transactions";
import { getDatabase } from "../db/connection";
import { preferredRating, ratingKey, type RatedMedia, type RatingIdentity } from "../../ratings";
import { lookupRatingsAndQueueMissing, saveMapping, mappingRetention } from "./mappings";

type Title = RatedMedia & { id: number; type?: string; media_type?: string; title?: string; imdb_id?: string | null; external_ids?: { imdb_id?: string | null } };
export function enrichRatings<T extends Title>(titles: T[], fallbackType?: "movie" | "tv", origin?: { path: string; params: Record<string, string> }): (T & { rating: ReturnType<typeof preferredRating> })[] {
  const db = getDatabase();
  const identities = titles.map<RatingIdentity>(title => ({ id: title.id, type: fallbackType
    ?? (title.media_type === "movie" || title.media_type === "tv" ? title.media_type : undefined)
    ?? (title.type === "movie" || title.type === "tv" ? title.type : title.title ? "movie" : "tv") }));
  transaction(db, () => {
    titles.forEach((title, index) => {
      const id = title.imdb_id !== undefined ? title.imdb_id : title.external_ids?.imdb_id;
      if (id !== undefined) saveMapping(db, identities[index], id,
        origin ? mappingRetention(db, origin.path, origin.params) : undefined);
    });
  });
  const found = lookupRatingsAndQueueMissing(db, identities);
  return titles.map((title, index) => {
    const row = found.get(ratingKey(identities[index]));
    const rating = row?.average_rating != null
      ? { value: row.average_rating, voteCount: row.vote_count, source: "imdb" as const }
      : preferredRating({ vote_average: title.vote_average, vote_count: title.vote_count });
    return { ...title, rating };
  });
}
