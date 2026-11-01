import "server-only";
import type Database from "better-sqlite3";

const migrations = [String.raw`
  CREATE TABLE api_cache (
    cache_key TEXT PRIMARY KEY, response_json TEXT NOT NULL,
    created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
    stale_until INTEGER NOT NULL, last_accessed INTEGER NOT NULL, response_size INTEGER NOT NULL
  );
  CREATE INDEX api_cache_stale ON api_cache(stale_until);
  CREATE INDEX api_cache_lru ON api_cache(last_accessed);
  CREATE TABLE imdb_ratings (
    imdb_id TEXT PRIMARY KEY, average_rating REAL NOT NULL CHECK(average_rating BETWEEN 0 AND 10),
    vote_count INTEGER NOT NULL CHECK(vote_count >= 0), updated_at INTEGER NOT NULL
  );
  CREATE TABLE imdb_mappings (
    media_type TEXT NOT NULL CHECK(media_type IN ('movie','tv')), tmdb_id INTEGER NOT NULL,
    imdb_id TEXT, updated_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
    PRIMARY KEY(media_type, tmdb_id)
  );
  CREATE INDEX imdb_mappings_expiry ON imdb_mappings(expires_at);
  CREATE TABLE import_metadata (
    id INTEGER PRIMARY KEY CHECK(id = 1), last_attempt INTEGER, last_success INTEGER,
    last_failure INTEGER, status TEXT NOT NULL DEFAULT 'idle', duration_ms INTEGER,
    row_count INTEGER NOT NULL DEFAULT 0, last_error TEXT, source_url TEXT,
    source_etag TEXT, source_modified TEXT, source_bytes INTEGER, peak_rss_bytes INTEGER
  );
  INSERT INTO import_metadata(id) VALUES(1);
  CREATE TABLE job_locks (name TEXT PRIMARY KEY, owner TEXT NOT NULL, expires_at INTEGER NOT NULL);
  CREATE TABLE cache_statistics (name TEXT PRIMARY KEY, value INTEGER NOT NULL);
`];

export function migrate(db: Database.Database) {
  db.transaction(() => {
    const version = db.pragma("user_version", { simple: true }) as number;
    if (version > migrations.length) throw new Error("Database schema is newer than this application");
    for (let i = version; i < migrations.length; i++) {
      db.exec(migrations[i]);
      db.pragma(`user_version = ${i + 1}`);
    }
  }).immediate();
}
