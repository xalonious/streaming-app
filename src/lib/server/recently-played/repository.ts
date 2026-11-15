import "server-only";
import type { DatabaseSync } from "node:sqlite";
import type { SearchResult } from "../../../api/tmdb";

export const PLAYBACK_RETENTION_MS = 7 * 24 * 60 * 60_000;

export class RecentlyPlayedRepository {
  constructor(readonly db: DatabaseSync) {}

  list(now = Date.now()): SearchResult[] {
    return this.db.prepare(`SELECT title_json FROM recently_played WHERE last_played_at >= ?
      ORDER BY last_played_at DESC, rowid DESC`).all(now - PLAYBACK_RETENTION_MS)
      .map(row => JSON.parse(row.title_json as string) as SearchResult);
  }

  record(title: SearchResult, playedAt = Date.now()) {
    this.db.prepare(`INSERT INTO recently_played (media_type, tmdb_id, title_json, last_played_at)
      VALUES (?, ?, ?, ?) ON CONFLICT(media_type, tmdb_id) DO UPDATE SET
      title_json=excluded.title_json, last_played_at=MAX(recently_played.last_played_at, excluded.last_played_at)`)
      .run(title.type, title.id, JSON.stringify(title), playedAt);
  }

  cleanup(now = Date.now()) {
    return Number(this.db.prepare("DELETE FROM recently_played WHERE last_played_at < ?")
      .run(now - PLAYBACK_RETENTION_MS).changes);
  }
}
