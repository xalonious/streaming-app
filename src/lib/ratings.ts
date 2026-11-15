export interface MediaRating {
  value: number | null;
  voteCount: number | null;
  source: "imdb" | "tmdb" | null;
}
export interface RatedMedia {
  rating?: MediaRating;
  vote_average?: number | null;
  vote_count?: number | null;
}
export type RatingIdentity = { id: number; type: "movie" | "tv" };
export type RatingUpdate = RatingIdentity & { rating: MediaRating | null };
export const RATING_STREAM_BATCH_SIZE = 250;

export function ratingKey(title: RatingIdentity) {
  return `${title.type}:${title.id}`;
}

export function liveRating(media: RatedMedia, update: MediaRating | null | undefined): MediaRating {
  if (update === undefined) return preferredRating(media);
  return update ?? preferredRating({ vote_average: media.vote_average, vote_count: media.vote_count });
}
export function preferredRating(media: RatedMedia): MediaRating {
  if (media.rating) return media.rating;
  return typeof media.vote_average === "number" && media.vote_average > 0
    ? { value: media.vote_average, voteCount: media.vote_count ?? null, source: "tmdb" }
    : { value: null, voteCount: null, source: null };
}
