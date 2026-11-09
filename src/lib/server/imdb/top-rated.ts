import "server-only";
import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { getDatabase } from "../db/connection";
import { createTmdbClient } from "../tmdbClient";
import { normalizeSearchResult } from "../tmdbTransforms";
import { mappingRetention, saveMapping } from "./mappings";
import { IMDB_CONFIG } from "./constants";

export const TOP_RATED_CONFIG = {
  minimumVotes: { movie: 25_000, tv: 10_000 },
  results: 20,
  candidateLimit: 1000,
  concurrency: 6,
  refreshTimeout: 10 * 60_000,
} as const;

type Candidate = { imdb_id: string; average_rating: number; vote_count: number };
type Title = {
  id: number;
  adult?: boolean;
  title?: string;
  name?: string;
  [key: string]: unknown;
};
type FindResults = { movie_results?: Title[]; tv_results?: Title[] };

export async function rankImdbTitles(
  db: Database.Database,
  type: "movie" | "tv",
  find: (imdbId: string) => Promise<FindResults>,
  assertCurrent: () => void = () => {},
) {
  const candidates = db.prepare(`SELECT imdb_id, average_rating, vote_count FROM imdb_ratings
    WHERE vote_count >= ? AND average_rating > 0
    ORDER BY average_rating DESC, vote_count DESC, imdb_id ASC LIMIT ?`)
    .all(TOP_RATED_CONFIG.minimumVotes[type], TOP_RATED_CONFIG.candidateLimit) as Candidate[];
  const results: ReturnType<typeof normalizeSearchResult>[] = [];
  const seen = new Set<number>();

  for (let offset = 0; offset < candidates.length && results.length < TOP_RATED_CONFIG.results; offset += TOP_RATED_CONFIG.concurrency) {
    assertCurrent();
    const batch = candidates.slice(offset, offset + TOP_RATED_CONFIG.concurrency);
    const resolved = await Promise.allSettled(batch.map(async candidate => ({ candidate, data: await find(candidate.imdb_id) })));
    assertCurrent();
    for (const result of resolved) {
      if (result.status === "rejected") throw result.reason;
      const { candidate, data } = result.value;
      const titles = type === "movie" ? data.movie_results : data.tv_results;
      const title = titles?.find(item => Number.isSafeInteger(item.id) && item.id > 0 && item.adult !== true);
      if (!title || seen.has(title.id)) continue;
      seen.add(title.id);
      const path = `/find/${candidate.imdb_id}`;
      saveMapping(db, { type, id: title.id }, candidate.imdb_id,
        mappingRetention(db, path, { external_source: "imdb_id" }));
      results.push(normalizeSearchResult({
        ...title,
        media_type: type,
        rating: { value: candidate.average_rating, voteCount: candidate.vote_count, source: "imdb" },
      }));
      if (results.length === TOP_RATED_CONFIG.results) break;
    }
  }
  return results;
}

export function getImdbTopRated(type: "movie" | "tv", db = getDatabase()): ReturnType<typeof normalizeSearchResult>[] {
  const row = db.prepare("SELECT results_json FROM imdb_top_rated WHERE media_type=?").get(type) as { results_json: string } | undefined;
  return row ? JSON.parse(row.results_json) : [];
}

function activeImport(db: Database.Database) {
  const row = db.prepare("SELECT last_success FROM import_metadata WHERE id=1").get() as { last_success: number | null };
  return row.last_success;
}

export function needsTopRatedRefresh(db: Database.Database) {
  const generation = activeImport(db);
  if (generation === null) return false;
  const saved = db.prepare("SELECT media_type FROM imdb_top_rated WHERE import_success=?").all(generation);
  return saved.length !== 2;
}

async function findTitle(imdbId: string): Promise<FindResults> {
  const { data } = await createTmdbClient().get(`/find/${imdbId}`, { params: { external_source: "imdb_id" } });
  return data as FindResults;
}

export async function refreshImdbTopRated(db: Database.Database, find = findTitle) {
  const generation = activeImport(db);
  if (generation === null) return { status: "unavailable" as const };
  if (!needsTopRatedRefresh(db)) return { status: "fresh" as const };
  const owner = randomUUID(), started = Date.now();
  const acquired = db.prepare(`INSERT INTO job_locks VALUES('imdb-top-rated',?,?)
    ON CONFLICT(name) DO UPDATE SET owner=excluded.owner,expires_at=excluded.expires_at
    WHERE job_locks.expires_at<=?`).run(owner, started + IMDB_CONFIG.lease, started);
  if (!acquired.changes) return { status: "locked" as const };
  let lostLease = false;
  const heartbeat = setInterval(() => {
    try {
      lostLease = db.prepare("UPDATE job_locks SET expires_at=? WHERE name='imdb-top-rated' AND owner=? AND expires_at>?")
        .run(Date.now() + IMDB_CONFIG.lease, owner, Date.now()).changes !== 1;
    } catch { lostLease = true; }
  }, IMDB_CONFIG.heartbeat);
  const assertCurrent = () => {
    if (lostLease || !db.prepare("SELECT 1 FROM job_locks WHERE name='imdb-top-rated' AND owner=? AND expires_at>?").get(owner, Date.now())) {
      throw new Error("IMDb top-rated refresh lock lost");
    }
    if (Date.now() - started > TOP_RATED_CONFIG.refreshTimeout) throw new Error("IMDb top-rated refresh exceeded its time budget");
    if (activeImport(db) !== generation) throw new Error("IMDb ratings changed during ranking preparation; retry required");
  };
  try {
    const movie = await rankImdbTitles(db, "movie", find, assertCurrent);
    const tv = await rankImdbTitles(db, "tv", find, assertCurrent);
    if (!movie.length || !tv.length) throw new Error("IMDb top-rated refresh produced an empty list; previous lists retained");
    db.transaction(() => {
      assertCurrent();
      const save = db.prepare(`INSERT INTO imdb_top_rated VALUES(?,?,?,?) ON CONFLICT(media_type) DO UPDATE SET
        results_json=excluded.results_json,import_success=excluded.import_success,prepared_at=excluded.prepared_at`);
      const prepared = Date.now();
      save.run("movie", JSON.stringify(movie), generation, prepared);
      save.run("tv", JSON.stringify(tv), generation, prepared);
    }).immediate();
    return { status: "success" as const, movies: movie.length, series: tv.length };
  } finally {
    clearInterval(heartbeat);
    db.prepare("DELETE FROM job_locks WHERE name='imdb-top-rated' AND owner=?").run(owner);
  }
}
