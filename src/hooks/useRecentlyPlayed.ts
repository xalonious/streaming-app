"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getRecentlyPlayedState, initialRecentlyPlayedState, refreshRecentlyPlayed, subscribeToRecentlyPlayed } from "../lib/recentlyPlayed";

export function useRecentlyPlayed() {
  const state = useSyncExternalStore(subscribeToRecentlyPlayed, getRecentlyPlayedState, () => initialRecentlyPlayedState);

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") void refreshRecentlyPlayed(); };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = window.setInterval(refresh, 30_000);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(timer);
    };
  }, []);

  return state;
}
