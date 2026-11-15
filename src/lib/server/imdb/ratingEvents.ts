import "server-only";
import type { DatabaseSync } from "node:sqlite";
import { ratingKey, type RatingIdentity } from "../../ratings";

type Listener = (db: DatabaseSync, titles: RatingIdentity[]) => void;
const globals = globalThis as typeof globalThis & {
  streamingRatingEvents?: { listeners: Set<Listener>; pending: Map<DatabaseSync, Map<string, RatingIdentity>> };
};
const events = globals.streamingRatingEvents ??= { listeners: new Set(), pending: new Map() };

export function subscribeToRatingChanges(listener: Listener) {
  events.listeners.add(listener);
  return () => { events.listeners.delete(listener); };
}

export function notifyRatingChange(db: DatabaseSync, title: RatingIdentity) {
  const scheduled = events.pending.size > 0;
  const titles = events.pending.get(db) ?? new Map<string, RatingIdentity>();
  titles.set(ratingKey(title), title);
  events.pending.set(db, titles);
  if (scheduled) return;
  queueMicrotask(() => {
    const batches = [...events.pending];
    events.pending.clear();
    for (const [database, changed] of batches) {
      if (!database.isOpen || database.isTransaction) continue;
      for (const listener of events.listeners) {
        try { listener(database, [...changed.values()]); }
        catch { console.warn("Live rating notification failed"); }
      }
    }
  });
}
