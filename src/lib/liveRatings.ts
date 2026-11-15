"use client";

import { RATING_STREAM_BATCH_SIZE, ratingKey, type MediaRating, type RatingIdentity, type RatingUpdate } from "./ratings";

const subscribers = new Map<string, Set<() => void>>();
const ratings = new Map<string, MediaRating | null>();
const connections = new Map<string, EventSource>();
let timer: ReturnType<typeof setTimeout> | undefined;

function receive(event: MessageEvent<string>, keys: Set<string>) {
  try {
    const updates: RatingUpdate[] = JSON.parse(event.data);
    if (!Array.isArray(updates)) return;
    for (const update of updates) {
      if (!update || (update.type !== "movie" && update.type !== "tv") || !Number.isSafeInteger(update.id)) continue;
      const key = ratingKey(update);
      if (!keys.has(key) || !subscribers.has(key)) continue;
      const rating = update.rating;
      if (rating !== null && (!rating || rating.source !== "imdb" || typeof rating.value !== "number"
        || !Number.isFinite(rating.value) || rating.value < 0 || rating.value > 10
        || (rating.voteCount !== null && (!Number.isSafeInteger(rating.voteCount) || rating.voteCount < 0)))) continue;
      const previous = ratings.get(key);
      if (previous === rating || (previous && rating && previous.value === rating.value && previous.voteCount === rating.voteCount && previous.source === rating.source)) continue;
      ratings.set(key, rating);
      subscribers.get(key)?.forEach(listener => listener());
    }
  } catch { /* Keep the last known rating if an event is incomplete. */ }
}

function connect() {
  timer = undefined;
  const keys = document.visibilityState === "hidden" ? [] : [...subscribers.keys()].sort();
  const batches = new Map<string, string[]>();
  for (let i = 0; i < keys.length; i += RATING_STREAM_BATCH_SIZE) {
    const batch = keys.slice(i, i + RATING_STREAM_BATCH_SIZE);
    batches.set(batch.join(","), batch);
  }
  for (const [signature, connection] of connections) {
    if (!batches.has(signature)) { connection.close(); connections.delete(signature); }
  }
  if (typeof EventSource === "undefined") return;
  for (const [signature, batch] of batches) {
    if (connections.has(signature)) continue;
    const connection = new EventSource(`/api/ratings/events?${new URLSearchParams({ titles: signature })}`);
    const watched = new Set(batch);
    connection.addEventListener("ratings", event => receive(event as MessageEvent<string>, watched));
    connections.set(signature, connection);
  }
}

function scheduleConnection() {
  if (timer !== undefined) return;
  timer = setTimeout(connect, 100);
}

function onVisibilityChange() {
  clearTimeout(timer);
  connect();
}

export const getLiveRating = (key: string) => ratings.get(key);
export function subscribeToLiveRating(title: RatingIdentity, listener: () => void) {
  const key = ratingKey(title);
  if (!subscribers.size) document.addEventListener("visibilitychange", onVisibilityChange);
  const listeners = subscribers.get(key) ?? new Set<() => void>();
  listeners.add(listener);
  subscribers.set(key, listeners);
  scheduleConnection();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { subscribers.delete(key); ratings.delete(key); }
    if (!subscribers.size) {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearTimeout(timer);
      connect();
    } else scheduleConnection();
  };
}
