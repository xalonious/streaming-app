export const IMDB_RATINGS_URL = "https://datasets.imdbws.com/title.ratings.tsv.gz";
export const IMDB_CONFIG = {
  schedule: "0 4 * * *", maxAge: 24 * 60 * 60 * 1000,
  lease: 2 * 60 * 1000, heartbeat: 20_000, timeout: 45 * 60 * 1000,
  batchSize: 1000, minimumRows: 1_000_000, minimumPreviousRatio: 0.8,
  maximumInvalidRatio: 0.01, maximumCompressedBytes: 150 * 1024 * 1024,
  maximumExpandedBytes: 500 * 1024 * 1024,
  retryDelays: [60_000, 5 * 60_000, 30 * 60_000],
} as const;
