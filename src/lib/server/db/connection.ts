import "server-only";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { migrate } from "./migrations";

const state = globalThis as typeof globalThis & { streamingDatabases?: Map<string, Database.Database> };
const connections = state.streamingDatabases ??= new Map();
export function databasePath() {
  return resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH || "./data/streaming.db");
}
export function openDatabase(path: string) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path, { timeout: 5000 });
  try {
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.pragma("busy_timeout = 5000");
    db.pragma("cache_size = -4096");
    migrate(db);
    return db;
  } catch (error) { db.close(); throw error; }
}
export function getDatabase() {
  const path = databasePath();
  let db = connections.get(path);
  if (!db?.open) { db = openDatabase(path); connections.set(path, db); }
  return db;
}
