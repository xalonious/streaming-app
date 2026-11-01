import "server-only";
import type Database from "better-sqlite3";
import { get } from "node:https";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { setImmediate } from "node:timers/promises";
import { IMDB_CONFIG, IMDB_RATINGS_URL } from "./constants";
import { acquireImportLock, ownsImportLock, releaseImportLock, renewImportLock } from "./locking";

export type RatingRow = { imdbId: string; averageRating: number; voteCount: number };
export function parseRating(line: string): RatingRow | null {
  const columns = line.replace(/\r$/, "").split("\t");
  const [imdbId, rating, votes] = columns;
  if (columns.length !== 3 || !/^tt\d{7,12}$/.test(imdbId) || !/^\d+(\.\d+)?$/.test(rating) || !/^\d+$/.test(votes)) return null;
  const averageRating = Number(rating), voteCount = Number(votes);
  if (averageRating < 0 || averageRating > 10 || !Number.isSafeInteger(voteCount)) return null;
  return { imdbId, averageRating, voteCount };
}

export type DatasetSource = {
  stream: Readable; etag?: string; modified?: string; length?: number;
};
export function downloadDataset(signal: AbortSignal): Promise<DatasetSource> {
  return new Promise((resolve, reject) => {
    const request = get(IMDB_RATINGS_URL, { signal, headers: { "Accept-Encoding": "identity" } }, response => {
      if (response.statusCode !== 200) {
        response.resume(); reject(new Error(`IMDb dataset download returned HTTP ${response.statusCode}`)); return;
      }
      resolve({ stream: response, etag: response.headers.etag, modified: response.headers["last-modified"],
        length: response.headers["content-length"] ? Number(response.headers["content-length"]) : undefined });
    });
    request.setTimeout(60_000, () => request.destroy(new Error("IMDb dataset download timed out")));
    request.on("error", reject);
  });
}

export async function importRatings(db: Database.Database, options: {
  source?: (signal: AbortSignal) => Promise<DatasetSource>;
  minimumRows?: number; force?: boolean; scheduled?: boolean;
} = {}) {
  const owner = acquireImportLock(db);
  if (!owner) return { status: "locked" as const };
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error("IMDb import exceeded its time budget")), IMDB_CONFIG.timeout);
  const heartbeat = setInterval(() => {
    try { if (!renewImportLock(db, owner)) controller.abort(new Error("IMDb import lock lost")); }
    catch { controller.abort(new Error("IMDb import lock renewal failed")); }
  }, IMDB_CONFIG.heartbeat);
  const assertOwner = () => {
    controller.signal.throwIfAborted();
    if (!ownsImportLock(db, owner)) throw new Error("IMDb import lock lost");
  };
  let peakRss = process.memoryUsage().rss;
  try {
    const metadata = db.prepare("SELECT last_success,row_count FROM import_metadata WHERE id=1").get() as { last_success: number | null; row_count: number };
    const active = db.prepare("SELECT 1 FROM imdb_ratings LIMIT 1").get();
    const dailySlot = new Date(started); dailySlot.setUTCHours(4, 0, 0, 0);
    if (dailySlot.getTime() > started) dailySlot.setUTCDate(dailySlot.getUTCDate() - 1);
    const fresh = options.scheduled ? (metadata.last_success ?? 0) >= dailySlot.getTime()
      : !!metadata.last_success && started - metadata.last_success < IMDB_CONFIG.maxAge;
    if (!options.force && active && fresh) return { status: "fresh" as const };
    db.transaction(() => {
      assertOwner();
      db.prepare("UPDATE import_metadata SET last_attempt=?,status='running',last_error=NULL WHERE id=1").run(started);
      db.exec(`DROP TABLE IF EXISTS imdb_ratings_staging;
        CREATE TABLE imdb_ratings_staging (
          imdb_id TEXT PRIMARY KEY, average_rating REAL NOT NULL CHECK(average_rating BETWEEN 0 AND 10),
          vote_count INTEGER NOT NULL CHECK(vote_count >= 0), updated_at INTEGER NOT NULL
        )`);
    }).immediate();
    const source = await (options.source ?? downloadDataset)(controller.signal);
    if (source.length && source.length > IMDB_CONFIG.maximumCompressedBytes) {
      source.stream.destroy(); throw new Error("IMDb dataset exceeds compressed size limit");
    }
    let compressed = 0, expanded = 0, rows = 0, invalid = 0, header = false, pending = "";
    let batch: RatingRow[] = [];
    const insert = db.prepare("INSERT INTO imdb_ratings_staging VALUES(?,?,?,?)");
    const commitBatch = db.transaction((records: RatingRow[]) => {
      assertOwner();
      for (const row of records) insert.run(row.imdbId, row.averageRating, row.voteCount, started);
    });
    const line = (value: string) => {
      if (!header) {
        if (value.replace(/\r$/, "") !== "tconst\taverageRating\tnumVotes") throw new Error("Unexpected IMDb dataset header");
        header = true; return;
      }
      if (!value) return;
      const row = parseRating(value);
      if (!row) { invalid++; return; }
      batch.push(row); rows++;
    };
    const counter = new Transform({ transform(chunk: Buffer, _encoding, callback) {
      compressed += chunk.length;
      callback(compressed > IMDB_CONFIG.maximumCompressedBytes ? new Error("IMDb compressed size limit exceeded") : null, chunk);
    } });
    const decoder = new TextDecoder("utf-8", { fatal: true });
    await pipeline(source.stream, counter, createGunzip(), async input => {
      for await (const chunk of input) {
        assertOwner();
        expanded += chunk.length;
        if (expanded > IMDB_CONFIG.maximumExpandedBytes) throw new Error("IMDb expanded size limit exceeded");
        pending += decoder.decode(chunk, { stream: true });
        let index: number;
        while ((index = pending.indexOf("\n")) !== -1) {
          if (index > 512) throw new Error("IMDb record exceeds line limit");
          line(pending.slice(0, index)); pending = pending.slice(index + 1);
          if (batch.length >= IMDB_CONFIG.batchSize) {
            commitBatch.immediate(batch); batch = [];
            peakRss = Math.max(peakRss, process.memoryUsage().rss);
            await setImmediate();
          }
        }
        if (pending.length > 512) throw new Error("IMDb record exceeds line limit");
      }
      pending += decoder.decode();
      if (pending) line(pending);
    }, { signal: controller.signal });
    if (source.length !== undefined && source.length !== compressed) throw new Error("Incomplete IMDb download");
    if (batch.length) commitBatch.immediate(batch);
    if (!header || rows < (options.minimumRows ?? IMDB_CONFIG.minimumRows)
      || rows < metadata.row_count * IMDB_CONFIG.minimumPreviousRatio
      || invalid / Math.max(1, rows + invalid) > IMDB_CONFIG.maximumInvalidRatio) throw new Error("IMDb dataset failed row-count/validation sanity checks");
    const duration = Date.now() - started;
    db.transaction(() => {
      assertOwner();
      db.exec(`ALTER TABLE imdb_ratings RENAME TO imdb_ratings_old;
        ALTER TABLE imdb_ratings_staging RENAME TO imdb_ratings;
        DROP TABLE imdb_ratings_old;`);
      db.prepare(`UPDATE import_metadata SET last_success=?,status='success',duration_ms=?,row_count=?,last_error=NULL,
        source_url=?,source_etag=?,source_modified=?,source_bytes=?,peak_rss_bytes=? WHERE id=1`)
        .run(Date.now(), duration, rows, IMDB_RATINGS_URL, source.etag ?? null, source.modified ?? null, compressed, peakRss);
    }).immediate();
    db.pragma("wal_checkpoint(PASSIVE)");
    return { status: "success" as const, rows, duration, peakRss };
  } catch (error) {
    if (ownsImportLock(db, owner)) db.transaction(() => {
      db.exec("DROP TABLE IF EXISTS imdb_ratings_staging");
      db.prepare("UPDATE import_metadata SET status='failed',last_failure=?,duration_ms=?,last_error=? WHERE id=1")
        .run(Date.now(), Date.now() - started, error instanceof Error ? (error.message || error.name).slice(0, 500) : "IMDb import failed");
    }).immediate();
    throw error;
  } finally {
    clearTimeout(timeout); clearInterval(heartbeat); releaseImportLock(db, owner);
  }
}
