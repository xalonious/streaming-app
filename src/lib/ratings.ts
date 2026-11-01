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
export function preferredRating(media: RatedMedia): MediaRating {
  if (media.rating) return media.rating;
  return typeof media.vote_average === "number" && media.vote_average > 0
    ? { value: media.vote_average, voteCount: media.vote_count ?? null, source: "tmdb" }
    : { value: null, voteCount: null, source: null };
}
