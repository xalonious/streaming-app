export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;
export const CACHE_CONFIG = {
  maxBytes: 250 * 1024 * 1024, staleGrace: DAY,
  cleanupInterval: 15 * 60 * 1000, touchInterval: HOUR, concurrency: 6,
  ttl: {
    trending: 2 * HOUR, popular: 6 * HOUR, topRated: DAY,
    nowPlaying: 6 * HOUR, upcoming: 6 * HOUR,
    movieDetails: 7 * DAY, tvDetails: DAY, tvSeasons: DAY,
    people: 14 * DAY, recommendations: DAY, search: HOUR,
    genres: 30 * DAY, mappings: 30 * DAY,
  },
} as const;
