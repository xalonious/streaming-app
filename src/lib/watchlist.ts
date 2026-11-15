"use client";

import type { MediaType, SearchResult } from "../api/tmdb";
import { listWatchlist, removeWatchlistTitle, saveWatchlistTitle } from "../api/watchlist";

type WatchlistState = { items: SearchResult[]; loading: boolean; error: string | null; pending: string[] };
export const initialWatchlistState: WatchlistState = { items: [], loading: true, error: null, pending: [] };
let state = initialWatchlistState;
let revision = 0;
let refreshing: Promise<void> | null = null;
const listeners = new Set<() => void>();

function update(patch: Partial<WatchlistState>) {
  state = { ...state, ...patch };
  listeners.forEach(listener => listener());
}

export const getWatchlistState = () => state;
export function subscribeToWatchlist(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function refreshWatchlist() {
  if (refreshing || state.pending.length) return refreshing;
  const version = revision;
  refreshing = listWatchlist()
    .then(items => { if (revision === version) update({ items, error: null, loading: false }); })
    .catch(() => { if (revision === version) update({ error: "Couldn't load your watchlist. Try again.", loading: false }); })
    .finally(() => { refreshing = null; });
  return refreshing;
}

export async function setWatchlistSaved(type: MediaType, id: number, saved: boolean) {
  const key = `${type}:${id}`;
  if (state.pending.includes(key)) return;
  revision++;
  update({ pending: [...state.pending, key], error: null });
  try {
    const items = await (saved ? saveWatchlistTitle(type, id) : removeWatchlistTitle(type, id));
    update({ items, loading: false });
  } catch {
    update({ error: `Couldn't ${saved ? "save" : "remove"} this title. Try again.` });
  } finally {
    revision++;
    update({ pending: state.pending.filter(value => value !== key) });
  }
}
