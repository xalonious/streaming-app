import "server-only";
import type { DatabaseSync } from "node:sqlite";
import { ratingKey, type RatingIdentity } from "../../ratings";
import { getDatabase } from "../db/connection";
import { CACHE_CONFIG } from "../cache/config";
import { cacheKey } from "../cache/keys";
import { createTmdbClient } from "../tmdbClient";
import { notifyRatingChange } from "./ratingEvents";

const IMDB_ID = /^tt\d{7,12}$/;
const MAPPING_FALLBACK_TTL = 5 * 60_000;

type Mapping = { media_type: RatingIdentity["type"]; tmdb_id: number; imdb_id: string | null; average_rating: number | null; vote_count: number | null };
function lookupRatings(db: DatabaseSync, titles: RatingIdentity[]) {
  if (!titles.length) return [];
  const rows = db.prepare(`SELECT m.media_type,m.tmdb_id,m.imdb_id,r.average_rating,r.vote_count
    FROM json_each(?) j JOIN imdb_mappings m ON m.media_type=json_extract(j.value,'$.type')
    AND m.tmdb_id=json_extract(j.value,'$.id') LEFT JOIN imdb_ratings r ON r.imdb_id=m.imdb_id
    WHERE typeof(m.expires_at)='integer' AND m.expires_at>?`).all(JSON.stringify(titles), Date.now()) as Mapping[];
  return rows.filter(row => row.imdb_id === null || IMDB_ID.test(row.imdb_id));
}

export function lookupRatingsAndQueueMissing(db: DatabaseSync, titles: RatingIdentity[]) {
  const rows = new Map(lookupRatings(db, titles).map(row => [`${row.media_type}:${row.tmdb_id}`, row]));
  const missing = titles.filter(title => !rows.has(ratingKey(title)));
  if (missing.length) queueMappings(missing);
  return rows;
}

export function saveMapping(db: DatabaseSync, title: RatingIdentity, imdbId: unknown, expiresAt?: number) {
  const id = typeof imdbId === "string" && IMDB_ID.test(imdbId) ? imdbId : null;
  const now = Date.now();
  const maximum = now + CACHE_CONFIG.ttl.mappings;
  const deadline = expiresAt ?? maximum;
  const usableDeadline = Number.isSafeInteger(deadline) && deadline > now;
  const expiry = usableDeadline ? Math.min(deadline, maximum) : now + MAPPING_FALLBACK_TTL;
  const result = db.prepare(`INSERT INTO imdb_mappings VALUES(?,?,?,?,?) ON CONFLICT(media_type,tmdb_id)
    DO UPDATE SET imdb_id=excluded.imdb_id,updated_at=excluded.updated_at,expires_at=excluded.expires_at
    WHERE imdb_mappings.imdb_id IS NOT excluded.imdb_id OR (
      imdb_mappings.expires_at != excluded.expires_at
      AND (? OR typeof(imdb_mappings.expires_at)!='integer' OR imdb_mappings.expires_at <= ?))`)
    .run(title.type, title.id, id, now, expiry, Number(usableDeadline), now);
  if (result.changes) notifyRatingChange(db, title);
}
export function mappingRetention(db: DatabaseSync, path: string, params = {}) {
  const row = db.prepare("SELECT stale_until FROM api_cache WHERE cache_key=?").get(cacheKey(path, params)) as { stale_until: number } | undefined;
  return row?.stale_until ?? 0;
}

export class MappingResolver {
  private pending = new Set<string>();
  private queue: RatingIdentity[] = [];
  private cooldown = new Map<string, number>();
  private active = 0;
  constructor(private resolve: (title: RatingIdentity) => Promise<void>, private concurrency = 2) {}
  enqueue(titles: RatingIdentity[]) {
    for (const title of titles) {
      const key = ratingKey(title);
      if (this.pending.has(key) || (this.cooldown.get(key) ?? 0) > Date.now() || this.queue.length >= 200) continue;
      this.pending.add(key); this.queue.push(title);
    }
    this.drain();
  }
  private drain() {
    while (this.active < this.concurrency && this.queue.length) {
      const title = this.queue.shift()!, key = ratingKey(title);
      this.active++;
      void this.resolve(title).catch(() => {
        if (this.cooldown.size >= 1000) this.cooldown.delete(this.cooldown.keys().next().value!);
        this.cooldown.set(key, Date.now() + 5 * 60_000);
      }).finally(() => { this.active--; this.pending.delete(key); this.drain(); });
    }
  }
}
const state = globalThis as typeof globalThis & { streamingMappingResolver?: MappingResolver };
function queueMappings(titles: RatingIdentity[]) {
  if (!process.env.TMDB_API_KEY) return;
  const db = getDatabase();
  if (!db.prepare("SELECT 1 FROM imdb_ratings LIMIT 1").get()) return;
  state.streamingMappingResolver ??= new MappingResolver(async title => {
    const db = getDatabase();
    if (lookupRatings(db, [title]).length) return;
    const path = `/${title.type}/${title.id}/external_ids`;
    const { data } = await createTmdbClient().get(path);
    saveMapping(db, title, data?.imdb_id, mappingRetention(db, path));
  });
  setImmediate(() => state.streamingMappingResolver!.enqueue(titles));
}
