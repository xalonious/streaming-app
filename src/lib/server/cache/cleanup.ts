import "server-only";
import type Database from "better-sqlite3";
import { CACHE_CONFIG } from "./config";
export function cleanupCache(db: Database.Database, now = Date.now(), maxBytes: number = CACHE_CONFIG.maxBytes) {
  return db.transaction(() => {
    let removed = db.prepare("DELETE FROM api_cache WHERE stale_until <= ?").run(now).changes;
    let bytes = (db.prepare("SELECT COALESCE(SUM(response_size),0) AS bytes FROM api_cache").get() as { bytes: number }).bytes;
    const oldest = db.prepare("SELECT cache_key, response_size FROM api_cache ORDER BY last_accessed LIMIT 100");
    const drop = db.prepare("DELETE FROM api_cache WHERE cache_key = ?");
    while (bytes > maxBytes) {
      const rows = oldest.all() as { cache_key: string; response_size: number }[];
      if (!rows.length) break;
      for (const row of rows) {
        if (bytes <= maxBytes) break;
        removed += drop.run(row.cache_key).changes;
        bytes -= row.response_size;
      }
    }
    return { removed, bytes };
  })();
}
