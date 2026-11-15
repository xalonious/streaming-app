"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getWatchlistState, initialWatchlistState, refreshWatchlist, subscribeToWatchlist } from "../lib/watchlist";

export function useWatchlist() {
  const state = useSyncExternalStore(subscribeToWatchlist, getWatchlistState, () => initialWatchlistState);

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") void refreshWatchlist(); };
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
