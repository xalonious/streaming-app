import "server-only";
import type { DatabaseSync } from "node:sqlite";
import type { MediaType, SearchResult } from "../../../api/tmdb";

export class WatchlistRepository {
  constructor(readonly db: DatabaseSync) {}

  list(): SearchResult[] {
    return this.db.prepare("SELECT title_json FROM watchlist ORDER BY added_at DESC, rowid DESC")
      .all().map(row => JSON.parse(row.title_json as string) as SearchResult);
  }

  save(title: SearchResult) {
    this.db.prepare(`INSERT INTO watchlist (media_type, tmdb_id, title_json, added_at)
      VALUES (?, ?, ?, ?) ON CONFLICT(media_type, tmdb_id) DO UPDATE SET title_json=excluded.title_json`)
      .run(title.type, title.id, JSON.stringify(title), Date.now());
  }

  delete(type: MediaType, id: number) {
    this.db.prepare("DELETE FROM watchlist WHERE media_type=? AND tmdb_id=?").run(type, id);
  }
}
