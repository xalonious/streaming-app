"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listProviders } from "../api/providers";
import type { MediaType, Provider } from "../lib/providers/types";
import { compatibleProviders, resolveTemplate, selectProvider } from "../lib/providers/templates";
import { readProviderPreference, saveProviderPreference } from "../lib/providers/preferences";

export function useProviderPlayback(type: MediaType, tmdbId: number, season?: number, episode?: number) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController(); controller.current = current;
    try {
      const data = await listProviders(current.signal);
      const preferred = readProviderPreference(type);
      setProviders(data.providers);
      setSelectedId(id => selectProvider(data.providers, type, id ?? preferred)?.id ?? null);
      setError("");
    } catch (e) { if (!current.signal.aborted) setError((e as Error).message); }
    finally { if (!current.signal.aborted) setLoading(false); }
  }, [type]);
  useEffect(() => {
    setSelectedId(null); setLoading(true);
    void refresh();
    const onFocus = () => { void refresh(); };
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { controller.current?.abort(); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, [refresh]);
  const selected = selectProvider(providers, type, selectedId);
  function select(id: string) {
    const provider = selectProvider(providers, type, id);
    setSelectedId(provider?.id ?? null);
    if (provider) saveProviderPreference(type, provider.id);
  }
  let url: string | null = null;
  let urlError = "";
  if (selected) try {
    url = resolveTemplate((type === "movie" ? selected.movieTemplate : selected.tvTemplate)!, type, { tmdbId, season, episode });
  } catch (e) { urlError = (e as Error).message; }
  return { providers: compatibleProviders(providers, type), selected, select, url, error: error || urlError, loading, refresh };
}
