"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getLiveRating, subscribeToLiveRating } from "../lib/liveRatings";
import { liveRating, type RatedMedia } from "../lib/ratings";

const serverSnapshot = () => undefined;
const noop = () => {};

export function useLiveRating(type: string | undefined, id: number | undefined, media: RatedMedia, enabled = true) {
  const valid = enabled && (type === "movie" || type === "tv") && Number.isSafeInteger(id) && id! > 0;
  const subscribe = useCallback((listener: () => void) => valid
    ? subscribeToLiveRating({ type: type as "movie" | "tv", id: id! }, listener) : noop, [valid, type, id]);
  const snapshot = useCallback(() => valid ? getLiveRating(`${type}:${id}`) : undefined, [valid, type, id]);
  const update = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return liveRating(media, update);
}
