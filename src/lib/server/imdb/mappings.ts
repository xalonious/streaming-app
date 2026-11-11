import "server-only";
import type { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../db/connection";
import { CACHE_CONFIG } from "../cache/config";
import { cacheKey } from "../cache/keys";
import { createTmdbClient } from "../tmdbClient";

export type MediaIdentity = { id: number; type: "movie" | "tv" };
export type Mapping = { media_type: "movie" | "tv"; tmdb_id: number; imdb_id: string | null; average_rating: number | null; vote_count: number | null };
export function lookupRatings(db: DatabaseSync, titles: MediaIdentity[]) {
  if (!titles.length) return [];
  return db.prepare(`SELECT m.media_type,m.tmdb_id,m.imdb_id,r.average_rating,r.vote_count
    FROM json_each(?) j JOIN imdb_mappings m ON m.media_type=json_extract(j.value,'$.type')
    AND m.tmdb_id=json_extract(j.value,'$.id') LEFT JOIN imdb_ratings r ON r.imdb_id=m.imdb_id
    WHERE m.expires_at>?`).all(JSON.stringify(titles), Date.now()) as Mapping[];
}
export function saveMapping(db: DatabaseSync, title: MediaIdentity, imdbId: unknown, expiresAt = Date.now() + CACHE_CONFIG.ttl.mappings) {
  const id = typeof imdbId === "string" && /^tt\d{7,12}$/.test(imdbId) ? imdbId : null;
  db.prepare(`INSERT INTO imdb_mappings VALUES(?,?,?,?,?) ON CONFLICT(media_type,tmdb_id)
    DO UPDATE SET imdb_id=excluded.imdb_id,updated_at=excluded.updated_at,expires_at=excluded.expires_at
    WHERE imdb_mappings.imdb_id IS NOT excluded.imdb_id OR imdb_mappings.expires_at != excluded.expires_at`)
    .run(title.type, title.id, id, Date.now(), Math.min(expiresAt, Date.now() + CACHE_CONFIG.ttl.mappings));
}
export function mappingRetention(db: DatabaseSync, path: string, params = {}) {
  const row = db.prepare("SELECT stale_until FROM api_cache WHERE cache_key=?").get(cacheKey(path, params)) as { stale_until: number } | undefined;
  return Math.min(row?.stale_until ?? Date.now(), Date.now() + CACHE_CONFIG.ttl.mappings);
}

export class MappingResolver {
  private pending = new Set<string>();
  private queue: MediaIdentity[] = [];
  private cooldown = new Map<string, number>();
  private active = 0;
  constructor(private resolve: (title: MediaIdentity) => Promise<void>, private concurrency = 2) {}
  enqueue(titles: MediaIdentity[]) {
    for (const title of titles) {
      const key = `${title.type}:${title.id}`;
      if (this.pending.has(key) || (this.cooldown.get(key) ?? 0) > Date.now() || this.queue.length >= 200) continue;
      this.pending.add(key); this.queue.push(title);
    }
    this.drain();
  }
  private drain() {
    while (this.active < this.concurrency && this.queue.length) {
      const title = this.queue.shift()!, key = `${title.type}:${title.id}`;
      this.active++;
      void this.resolve(title).catch(() => {
        if (this.cooldown.size >= 1000) this.cooldown.delete(this.cooldown.keys().next().value!);
        this.cooldown.set(key, Date.now() + 5 * 60_000);
      }).finally(() => { this.active--; this.pending.delete(key); this.drain(); });
    }
  }
}
const state = globalThis as typeof globalThis & { streamingMappingResolver?: MappingResolver };
export function queueMappings(titles: MediaIdentity[]) {
  if (!process.env.TMDB_API_KEY) return;
  const db = getDatabase();
  if (!db.prepare("SELECT 1 FROM imdb_ratings LIMIT 1").get()) return;
  state.streamingMappingResolver ??= new MappingResolver(async title => {
    const db = getDatabase();
    if (lookupRatings(db, [title]).length) return;
    const path = `/${title.type}/${title.id}/external_ids`;
    const { data } = await createTmdbClient().get(path);
    saveMapping(db, title, data.imdb_id, mappingRetention(db, path));
  });
  setImmediate(() => state.streamingMappingResolver!.enqueue(titles));
}
