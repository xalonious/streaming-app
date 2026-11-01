import "server-only";
import type Database from "better-sqlite3";
import { getDatabase } from "../db/connection";
import { CACHE_CONFIG } from "./config";
import { cleanupCache } from "./cleanup";
import { retention } from "./policies";
type Counter = "hits" | "misses" | "stale" | "refreshSuccess" | "refreshFailure" | "upstreamRequests";
type Entry = { response_json: string; expires_at: number; stale_until: number; last_accessed: number };
export type Loaded<T> = { data: T; headers?: Record<string, unknown> };

export class PersistentCache {
  private inFlight = new Map<string, Promise<unknown>>();
  private failures = new Map<string, { until: number; attempts: number; error: unknown }>();
  private counters = new Map<Counter, number>();
  private lastCleanup = 0;
  private lastFlush = 0;
  constructor(readonly db: Database.Database, private now = Date.now) {}
  flushStats() {
    const insert = this.db.prepare("INSERT INTO cache_statistics(name,value) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET value=value+excluded.value");
    this.db.transaction(() => { for (const [key, value] of this.counters) insert.run(key, value); })();
    this.counters.clear(); this.lastFlush = this.now();
  }
  count(key: Counter) { this.counters.set(key, (this.counters.get(key) ?? 0) + 1); }
  maintain() {
    if (this.now() - this.lastCleanup >= CACHE_CONFIG.cleanupInterval) {
      cleanupCache(this.db, this.now()); this.lastCleanup = this.now();
      for (const [key, failure] of this.failures) if (failure.until < this.now()) this.failures.delete(key);
    }
    if (this.now() - this.lastFlush >= 30_000) this.flushStats();
  }
  async get<T>(key: string, ttl: number, load: () => Promise<Loaded<T>>): Promise<T> {
    this.maintain();
    const row = this.db.prepare("SELECT response_json,expires_at,stale_until,last_accessed FROM api_cache WHERE cache_key=?").get(key) as Entry | undefined;
    if (row && row.stale_until > this.now()) {
      if (this.now() - row.last_accessed > CACHE_CONFIG.touchInterval) this.db.prepare("UPDATE api_cache SET last_accessed=? WHERE cache_key=?").run(this.now(), key);
      if (row.expires_at > this.now()) this.count("hits");
      else {
        this.count("stale");
        if ((this.failures.get(key)?.until ?? 0) <= this.now()) void this.refresh(key, ttl, load).catch(() => {});
      }
      return JSON.parse(row.response_json) as T;
    }
    this.count("misses");
    const failure = this.failures.get(key);
    if (failure && failure.until > this.now()) throw failure.error;
    return this.refresh(key, ttl, load);
  }
  private refresh<T>(key: string, ttl: number, load: () => Promise<Loaded<T>>): Promise<T> {
    const pending = this.inFlight.get(key);
    if (pending) return pending as Promise<T>;
    const promise = Promise.resolve().then(load).then(({ data, headers = {} }) => {
      const now = this.now(), policy = retention(ttl, headers, now);
      const json = JSON.stringify(data), size = Buffer.byteLength(json);
      if (policy.ttl > 0 && size <= CACHE_CONFIG.maxBytes) {
        this.db.prepare(`INSERT INTO api_cache VALUES(?,?,?,?,?,?,?) ON CONFLICT(cache_key) DO UPDATE SET
          response_json=excluded.response_json,created_at=excluded.created_at,expires_at=excluded.expires_at,
          stale_until=excluded.stale_until,last_accessed=excluded.last_accessed,response_size=excluded.response_size`)
          .run(key, json, now, now + policy.ttl, now + policy.ttl + policy.stale, now, size);
        cleanupCache(this.db, now);
      } else this.db.prepare("DELETE FROM api_cache WHERE cache_key=?").run(key);
      this.failures.delete(key); this.count("refreshSuccess");
      return data;
    }).catch((error: unknown) => {
      const attempts = Math.min(6, (this.failures.get(key)?.attempts ?? 0) + 1);
      if (this.failures.size >= 1000) this.failures.delete(this.failures.keys().next().value!);
      this.failures.set(key, { attempts, until: this.now() + Math.min(60_000, 1000 * 2 ** attempts), error });
      this.count("refreshFailure");
      console.warn("TMDB metadata refresh failed; bounded retry backoff applied");
      throw error;
    }).finally(() => { this.inFlight.delete(key); });
    this.inFlight.set(key, promise);
    return promise;
  }
}
const state = globalThis as typeof globalThis & { streamingCache?: PersistentCache };
export function getCache() {
  const db = getDatabase();
  if (!state.streamingCache || state.streamingCache.db !== db) state.streamingCache = new PersistentCache(db);
  return state.streamingCache;
}
