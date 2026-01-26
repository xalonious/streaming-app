import { useEffect, useMemo, useRef, useState } from "react";
import { getTvSeason } from "../api/details";

export type TmdbEpisode = {
  id: number;
  name?: string;
  overview?: string;
  still_path?: string | null;
  episode_number: number;
  air_date?: string;
};

export type TmdbSeason = { episodes?: TmdbEpisode[] };

export type ErrorLike = { __error: true };

export type SeasonOption = { id?: number; season_number: number; name?: string };

export type EpisodeWithSeason = TmdbEpisode & { __season?: number };

type Progress = { loaded: number; total: number };

export function useCrossSeasonEpisodeSearch({
  tmdbId,
  enabled,
  seasonNumber,
  seasonOptions,
  seasonCache,
  setSeasonCache,
  seasonData,
  episodeFilter,
  concurrency = 3,
}: {
  tmdbId: number;
  enabled: boolean;
  seasonNumber: number;
  seasonOptions: SeasonOption[];
  seasonCache: Record<number, TmdbSeason | ErrorLike>;
  setSeasonCache: React.Dispatch<React.SetStateAction<Record<number, TmdbSeason | ErrorLike>>>;
  seasonData: TmdbSeason | ErrorLike | null;
  episodeFilter: string;
  concurrency?: number;
}) {
  const [searchingAll, setSearchingAll] = useState(false);
  const [prefetchProgress, setPrefetchProgress] = useState<Progress>({ loaded: 0, total: 0 });

  const runIdRef = useRef(0);

  const allSeasonNumbers = useMemo(() => {
    return seasonOptions
      .map((s) => s.season_number)
      .filter((n) => n > 0)
      .sort((a, b) => a - b);
  }, [seasonOptions]);

  useEffect(() => {
    if (!enabled) {
      setSearchingAll(false);
      setPrefetchProgress({ loaded: 0, total: 0 });
      return;
    }

    const q = episodeFilter.trim();
    if (!q) {
      setSearchingAll(false);
      setPrefetchProgress({ loaded: 0, total: 0 });
      return;
    }

    runIdRef.current += 1;
    const runId = runIdRef.current;

    setSearchingAll(true);

    const total = allSeasonNumbers.length;
    const loadedNow = allSeasonNumbers.reduce((acc, sn) => acc + (seasonCache[sn] ? 1 : 0), 0);
    setPrefetchProgress({ loaded: loadedNow, total });

    const queue = allSeasonNumbers.filter((sn) => !seasonCache[sn]);

    if (queue.length === 0) {
      setPrefetchProgress({ loaded: total, total });
      return;
    }

    let cancelled = false;

    const runOne = async (sn: number) => {
      try {
        const s = (await getTvSeason(tmdbId, sn)) as TmdbSeason;
        if (cancelled || runIdRef.current !== runId) return;
        setSeasonCache((prev) => (prev[sn] ? prev : { ...prev, [sn]: s }));
      } catch {
      } finally {
        if (cancelled || runIdRef.current !== runId) return;
        setPrefetchProgress((p) => ({
          loaded: Math.min(p.total, p.loaded + 1),
          total: p.total,
        }));
      }
    };

    (async () => {
      let idx = 0;
      const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
        while (idx < queue.length) {
          const sn = queue[idx++];
          await runOne(sn);
        }
      });

      await Promise.all(workers);

      if (!cancelled && runIdRef.current === runId) {
        setPrefetchProgress((p) => ({ loaded: p.total, total: p.total }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, episodeFilter, tmdbId, allSeasonNumbers, concurrency, seasonCache, setSeasonCache]);

  const { episodes, isCrossSeason } = useMemo((): { episodes: EpisodeWithSeason[]; isCrossSeason: boolean } => {
    if (!enabled) return { episodes: [], isCrossSeason: false };

    const q = episodeFilter.trim().toLowerCase();

    if (!q) {
      const s = seasonData as TmdbSeason | ErrorLike | null;
      return { episodes: (s as any)?.episodes ?? [], isCrossSeason: false };
    }

    const all: EpisodeWithSeason[] = [];

    for (const sn of allSeasonNumbers) {
      const sdata = seasonCache[sn] as TmdbSeason | ErrorLike | undefined;
      const eps = (sdata as any)?.episodes ?? [];
      for (const ep of eps as TmdbEpisode[]) all.push({ ...ep, __season: sn });
    }

    const current = seasonData as TmdbSeason | ErrorLike | null;
    if ((current as any)?.episodes?.length) {
      const existing = new Set(all.map((e) => `${e.__season}-${e.episode_number}-${e.id}`));
      for (const ep of (current as any).episodes as TmdbEpisode[]) {
        const key = `${seasonNumber}-${ep.episode_number}-${ep.id}`;
        if (!existing.has(key)) all.push({ ...ep, __season: seasonNumber });
      }
    }

    const filtered = all.filter((ep) => {
      const epSeason = ep.__season ?? seasonNumber;
      const s = `s${epSeason}`.toLowerCase();
      const n = `e${ep.episode_number}`.toLowerCase();
      const se = `${s}${n}`;
      const name = (ep.name ?? "").toLowerCase();
      return se.includes(q) || s.includes(q) || n.includes(q) || name.includes(q);
    });

    return { episodes: filtered, isCrossSeason: true };
  }, [enabled, episodeFilter, seasonData, seasonCache, seasonNumber, allSeasonNumbers]);

  useEffect(() => {
    if (!episodeFilter.trim()) {
      setSearchingAll(false);
      setPrefetchProgress({ loaded: 0, total: 0 });
    } else if (enabled) {
      setSearchingAll(true);
    }
  }, [episodeFilter, enabled]);

  return { episodes, isCrossSeason, searchingAll, prefetchProgress };
}
