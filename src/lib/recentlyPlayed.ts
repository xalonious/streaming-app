"use client";

import type { MediaType, SearchResult } from "../api/tmdb";
import { listRecentlyPlayed, recordRecentlyPlayed as recordTitle } from "../api/recentlyPlayed";

type RecentlyPlayedState = { items: SearchResult[]; error: string | null };
export const initialRecentlyPlayedState: RecentlyPlayedState = { items: [], error: null };
let state = initialRecentlyPlayedState;
let revision = 0;
let latestRecording = 0;
let refreshing: Promise<void> | null = null;
const listeners = new Set<() => void>();

function update(patch: Partial<RecentlyPlayedState>) {
  state = { ...state, ...patch };
  listeners.forEach(listener => listener());
}

export const getRecentlyPlayedState = () => state;
export function subscribeToRecentlyPlayed(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function refreshRecentlyPlayed() {
  if (refreshing) return refreshing;
  const version = revision;
  refreshing = listRecentlyPlayed()
    .then(items => { if (revision === version) update({ items, error: null }); })
    .catch(() => { if (revision === version) update({ error: "Couldn't load recently played. Try again." }); })
    .finally(() => { refreshing = null; });
  return refreshing;
}

export async function recordRecentlyPlayed(type: MediaType, id: number) {
  const recording = ++latestRecording;
  revision++;
  try {
    const items = await recordTitle(type, id);
    if (recording === latestRecording) update({ items, error: null });
    return true;
  } catch {
    console.warn("Couldn't save recently played title");
    return false;
  } finally { revision++; }
}
