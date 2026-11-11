import "server-only";
import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { IMDB_CONFIG } from "./constants";

export function acquireImportLock(db: DatabaseSync, now = Date.now()) {
  const owner = randomUUID();
  const result = db.prepare(`INSERT INTO job_locks VALUES('imdb-import',?,?)
    ON CONFLICT(name) DO UPDATE SET owner=excluded.owner,expires_at=excluded.expires_at
    WHERE job_locks.expires_at <= ?`).run(owner, now + IMDB_CONFIG.lease, now);
  return result.changes ? owner : null;
}
export function renewImportLock(db: DatabaseSync, owner: string, now = Date.now()) {
  return db.prepare("UPDATE job_locks SET expires_at=? WHERE name='imdb-import' AND owner=? AND expires_at>?")
    .run(now + IMDB_CONFIG.lease, owner, now).changes === 1;
}
export function ownsImportLock(db: DatabaseSync, owner: string) {
  return !!db.prepare("SELECT 1 FROM job_locks WHERE name='imdb-import' AND owner=? AND expires_at>?").get(owner, Date.now());
}
export function releaseImportLock(db: DatabaseSync, owner: string) {
  db.prepare("DELETE FROM job_locks WHERE name='imdb-import' AND owner=?").run(owner);
}
