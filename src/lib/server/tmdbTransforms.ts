import "server-only";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";
const IMG_BASE_ORIGINAL = "https://image.tmdb.org/t/p/original";

const MOVIE_GENRES: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
};

const TV_GENRES: Record<number, string> = {
  10759: "Action & Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  10762: "Kids", 9648: "Mystery", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk",
  10768: "War & Politics", 37: "Western",
};

export function normalizeSearchResult(r: any) {
  const type = (r.media_type ?? (r.title ? "movie" : "tv")) as "movie" | "tv";
  const genreMap = type === "movie" ? MOVIE_GENRES : TV_GENRES;
  const genres: string[] = Array.isArray(r.genres)
    ? r.genres.map((g: any) => g.name)
    : (r.genre_ids ?? []).map((id: number) => genreMap[id]).filter(Boolean);

  return {
    id: r.id,
    type,
    title: r.title ?? r.name ?? "",
    year: ((r.release_date ?? r.first_air_date ?? "").slice(0, 4) || null) as string | null,
    poster: r.poster_path ? `${IMG_BASE}${r.poster_path}` : null,
    backdrop: r.backdrop_path ? `${IMG_BASE_ORIGINAL}${r.backdrop_path}` : null,
    overview: r.overview ?? "",
    vote_average: typeof r.vote_average === "number" ? Math.round(r.vote_average * 10) / 10 : null,
    genres,
  };
}

export function getKnownForScore(c: any) {
  const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const character = String(c?.character ?? "").trim().toLowerCase();
  const isSelf = !character || ["self", "himself", "herself", "host", "narrator"].some((role) => character.startsWith(role));
  const isVoice = character.includes("voice");

  if (!c.poster_path || isSelf || (c.vote_count ?? 0) < 50) return null;

  let roleWeight = 0.4;
  if (c.media_type === "tv") {
    const episodes = Number(c.episode_count ?? 0);
    if (episodes < 2 || (episodes < 5 && isVoice)) return null;
    roleWeight = episodes === 2 ? 0.22 : clamp(Math.log1p(episodes) / Math.log1p(60), 0.28, 1);
  } else if (typeof c.order === "number") {
    roleWeight = clamp(1 - c.order / 20, 0.18, 1);
  }

  const popularityScore = clamp(Math.log1p(c.popularity ?? 0) / Math.log1p(350));
  const voteCountScore = clamp(Math.log1p(c.vote_count ?? 0) / Math.log1p(8000));
  const ratingScore = clamp(((c.vote_average ?? 0) - 4) / 4);

  return roleWeight * 55 + popularityScore * 25 + voteCountScore * 12 + ratingScore * 8;
}
