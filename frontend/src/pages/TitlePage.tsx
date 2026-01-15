import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { getMovieDetails, getTvDetails, getTvSeason } from "../api/details";

const TMDB_IMG = "https://image.tmdb.org/t/p/";

const img = (path?: string | null, size: string = "w1280") =>
  path ? `${TMDB_IMG}${size}${path}` : null;

type TmdbGenre = { id: number; name: string };
type TmdbMovie = {
  title?: string;
  tagline?: string;
  overview?: string;
  release_date?: string;
  backdrop_path?: string | null;
  poster_path?: string | null;
  runtime?: number;
  genres?: TmdbGenre[];
};
type TmdbTvSeasonSummary = { id?: number; season_number: number; name?: string };
type TmdbTv = {
  name?: string;
  overview?: string;
  first_air_date?: string;
  backdrop_path?: string | null;
  poster_path?: string | null;
  number_of_seasons?: number;
  genres?: TmdbGenre[];
  seasons?: TmdbTvSeasonSummary[];
};

type TmdbEpisode = {
  id: number;
  name?: string;
  overview?: string;
  still_path?: string | null;
  episode_number: number;
  air_date?: string;
};

type TmdbSeason = { episodes?: TmdbEpisode[] };

type ErrorLike = { __error: true };

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur">
      {children}
    </span>
  );
}

function PrimaryButton({ children, to }: { children: React.ReactNode; to: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:opacity-90"
    >
      {children}
    </Link>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm font-semibold text-white/90 backdrop-blur hover:bg-black/45"
    >
      {children}
    </button>
  );
}

function SeasonDropdown({
  seasons,
  value,
  onChange,
}: {
  seasons: Array<{ id?: number; season_number: number; name?: string }>;
  value: number;
  onChange: (seasonNumber: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(
    null
  );

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => {
    const found = seasons.find((s) => s.season_number === value);
    return found?.name ?? `Season ${value}`;
  }, [seasons, value]);

  const updatePos = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      left: r.left,
      top: r.bottom + 10,
      width: r.width,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onResize = () => updatePos();
    const onScroll = () => updatePos();

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const w = wrapRef.current;
      const menu = listRef.current?.parentElement?.parentElement;
      const t = e.target as Node;

      const insideButton = !!w && w.contains(t);
      const insideMenu = !!menu && menu.contains(t);

      if (!insideButton && !insideMenu) setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;

    const active = el.querySelector(`[data-season="${value}"]`) as HTMLElement | null;
    if (active) {
      const top = active.offsetTop;
      const height = active.offsetHeight;
      el.scrollTop = Math.max(0, top - el.clientHeight / 2 + height / 2);
    }
  }, [open, value]);

  const menu =
    open && pos
      ? createPortal(
          <div
            className="fixed z-[9999]"
            style={{
              left: pos.left,
              top: pos.top,
              width: Math.min(420, Math.max(pos.width, 260)),
            }}
          >
            <div className="rounded-2xl border border-white/12 bg-black/70 backdrop-blur-xl shadow-[0_30px_90px_rgba(0,0,0,0.75)] overflow-hidden">
              <div className="px-3.5 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/55">
                    Seasons
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10"
                  >
                    Esc
                  </button>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div ref={listRef} role="listbox" className="max-h-[320px] overflow-auto p-2">
                {seasons.map((s) => {
                  const n = s.season_number;
                  const name = s.name ?? `Season ${n}`;
                  const active = n === value;

                  return (
                    <button
                      key={s.id ?? n}
                      type="button"
                      role="option"
                      aria-selected={active}
                      data-season={n}
                      onClick={() => {
                        onChange(n);
                        setOpen(false);
                      }}
                      className={[
                        "group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/80 hover:bg-white/7 hover:text-white",
                      ].join(" ")}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={[
                            "inline-flex h-7 w-7 items-center justify-center rounded-lg border text-[11px] font-semibold",
                            active
                              ? "border-white/20 bg-white/10 text-white"
                              : "border-white/10 bg-black/30 text-white/70 group-hover:border-white/15 group-hover:text-white/85",
                          ].join(" ")}
                        >
                          {String(n).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 truncate font-semibold">{name}</span>
                      </span>

                      {active ? (
                        <span className="text-white/85">✓</span>
                      ) : (
                        <span className="text-white/35 group-hover:text-white/55">→</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="h-px bg-white/10" />

              <div className="px-3.5 py-2.5 text-[11px] text-white/45">Tip: click outside to close.</div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "group relative inline-flex w-[220px] items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-sm",
          "border border-white/10 bg-black/35 text-white/90 backdrop-blur outline-none",
          "hover:border-white/20 hover:bg-black/45",
          "focus-visible:ring-2 focus-visible:ring-white/15",
          open ? "border-white/25 bg-black/55" : "",
        ].join(" ")}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white/25 shadow-[0_0_18px_rgba(255,255,255,0.18)] group-hover:bg-white/35" />
          <span className="min-w-0 truncate font-semibold">{selected}</span>
        </span>

        <span className={["text-white/55 transition group-hover:text-white/70", open ? "rotate-180" : ""].join(" ")}>
          ▾
        </span>

        <span className="pointer-events-none absolute inset-0 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_50px_rgba(0,0,0,0.55)]" />
      </button>

      {menu}
    </div>
  );
}

export default function TitlePage() {
  const { type, id } = useParams();
  const tmdbId = Number(id);

  const [data, setData] = useState<TmdbMovie | TmdbTv | ErrorLike | null>(null);
  const [seasonNumber, setSeasonNumber] = useState<number>(1);
  const [seasonData, setSeasonData] = useState<TmdbSeason | ErrorLike | null>(null);
  const [loadingSeason, setLoadingSeason] = useState(false);

  const [episodeFilter, setEpisodeFilter] = useState("");

  const [seasonCache, setSeasonCache] = useState<Record<number, TmdbSeason | ErrorLike>>({});
  const [searchingAll, setSearchingAll] = useState(false);
  const [prefetchProgress, setPrefetchProgress] = useState<{ loaded: number; total: number }>({
    loaded: 0,
    total: 0,
  });

  const isTv = type === "tv";
  const isMovie = type === "movie";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setData(null);
      setSeasonData(null);
      setEpisodeFilter("");
      setSeasonCache({});
      setSearchingAll(false);
      setPrefetchProgress({ loaded: 0, total: 0 });

      try {
        if (isMovie) {
          const m = (await getMovieDetails(tmdbId)) as TmdbMovie;
          if (!cancelled) setData(m);
        } else if (isTv) {
          const tv = (await getTvDetails(tmdbId)) as TmdbTv;
          if (cancelled) return;
          setData(tv);

          const first = (tv?.seasons ?? [])
            .map((s: TmdbTvSeasonSummary) => s.season_number)
            .filter((n: number) => n > 0)
            .sort((a: number, b: number) => a - b)[0];

          setSeasonNumber(first ?? 1);
        }
      } catch {
        if (!cancelled) setData({ __error: true });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tmdbId, isMovie, isTv]);

  useEffect(() => {
    if (!isTv || !data || (data as ErrorLike).__error) return;

    let cancelled = false;

    const cached = seasonCache[seasonNumber];
    if (cached) {
      setSeasonData(cached);
      setLoadingSeason(false);
      return;
    }

    setLoadingSeason(true);

    (getTvSeason(tmdbId, seasonNumber) as Promise<TmdbSeason>)
      .then((s) => {
        if (cancelled) return;
        setSeasonData(s);
        setSeasonCache((prev) => ({ ...prev, [seasonNumber]: s }));
      })
      .catch(() => {
        if (cancelled) return;
        setSeasonData({ __error: true });
      })
      .finally(() => {
        if (!cancelled) setLoadingSeason(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isTv, data, tmdbId, seasonNumber, seasonCache]);

  const title = isMovie ? (data as TmdbMovie | null)?.title : (data as TmdbTv | null)?.name;
  const tagline = isMovie ? (data as TmdbMovie | null)?.tagline : (data as TmdbTv | null)?.overview;
  const year = isMovie
    ? ((data as TmdbMovie | null)?.release_date ?? "").slice(0, 4)
    : ((data as TmdbTv | null)?.first_air_date ?? "").slice(0, 4);

  const backdrop = useMemo(
    () => img((data as any)?.backdrop_path, "w1920_and_h800_multi_faces"),
    [data]
  );
  const poster = useMemo(() => img((data as any)?.poster_path, "w500"), [data]);

  const genres = ((data as any)?.genres ?? [])
    .map((g: TmdbGenre) => g.name)
    .filter(Boolean);

  const seasonOptions = useMemo((): Array<{ id?: number; season_number: number; name?: string }> => {
    const tv = data as TmdbTv | ErrorLike | null;
    return ((tv as any)?.seasons ?? [])
      .filter((s: TmdbTvSeasonSummary) => (s.season_number ?? 0) > 0)
      .map((s: TmdbTvSeasonSummary) => ({
        id: s.id,
        season_number: s.season_number,
        name: s.name,
      }));
  }, [data]);

  const allSeasonNumbers = useMemo(() => {
    return seasonOptions.map((s: { season_number: number }) => s.season_number).sort((a: number, b: number) => a - b);
  }, [seasonOptions]);

  useEffect(() => {
    if (!isTv || !data || (data as ErrorLike).__error) return;

    const q = episodeFilter.trim();
    if (!q) {
      setSearchingAll(false);
      setPrefetchProgress({ loaded: 0, total: 0 });
      return;
    }

    let cancelled = false;
    setSearchingAll(true);

    const total = allSeasonNumbers.length;
    const loadedNow = allSeasonNumbers.reduce(
      (acc: number, sn: number) => acc + (seasonCache[sn] ? 1 : 0),
      0
    );
    setPrefetchProgress({ loaded: loadedNow, total });

    const concurrency = 3;

    (async () => {
      const queue = allSeasonNumbers.filter((sn: number) => !seasonCache[sn]);
      let active = 0;
      let idx = 0;

      const runOne = async (sn: number) => {
        try {
          const s = (await getTvSeason(tmdbId, sn)) as TmdbSeason;
          if (cancelled) return;
          setSeasonCache((prev) => (prev[sn] ? prev : { ...prev, [sn]: s }));
        } catch {
          return;
        } finally {
          if (cancelled) return;
          setPrefetchProgress((p) => ({
            loaded: Math.min(p.total, p.loaded + 1),
            total: p.total,
          }));
        }
      };

      await new Promise<void>((resolve) => {
        const pump = () => {
          if (cancelled) return resolve();
          while (active < concurrency && idx < queue.length) {
            const sn = queue[idx++];
            active++;
            runOne(sn).finally(() => {
              active--;
              pump();
            });
          }
          if (active === 0 && idx >= queue.length) resolve();
        };
        pump();
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [episodeFilter, isTv, data, tmdbId, allSeasonNumbers, seasonCache]);

  const { episodes, isCrossSeason } = useMemo(() => {
    const q = episodeFilter.trim().toLowerCase();

    if (!q) {
      const s = seasonData as TmdbSeason | ErrorLike | null;
      return { episodes: (s as any)?.episodes ?? [], isCrossSeason: false };
    }

    const all: Array<TmdbEpisode & { __season: number }> = [];

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
      const ov = (ep.overview ?? "").toLowerCase();
      return se.includes(q) || s.includes(q) || n.includes(q) || name.includes(q) || ov.includes(q);
    });

    return { episodes: filtered, isCrossSeason: true };
  }, [episodeFilter, seasonData, seasonCache, seasonNumber, allSeasonNumbers]);

  if (!data) {
    return (
      <div className="min-h-[100svh] bg-zinc-950 text-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-zinc-400">Loading…</div>
      </div>
    );
  }

  if ((data as ErrorLike).__error) {
    return (
      <div className="min-h-[100svh] bg-zinc-950 text-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-sm text-red-300">
            Failed to load title.
          </div>
          <div className="mt-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-600"
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-black text-white">
      <div className="relative isolate min-h-[100svh]">
        {backdrop ? (
          <div className="pointer-events-none fixed inset-0 z-0">
            <img src={backdrop} alt="" className="h-[100svh] w-full object-cover" loading="lazy" />
          </div>
        ) : (
          <div className="pointer-events-none fixed inset-0 z-0 bg-zinc-950" />
        )}

        <div className="pointer-events-none fixed inset-0 z-10 bg-gradient-to-b from-black/50 via-black/60 to-black" />
        <div className="pointer-events-none fixed inset-0 z-10 bg-gradient-to-r from-black via-black/70 to-transparent" />

        <div className="relative z-20">
          <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm text-white/90 backdrop-blur hover:bg-black/55"
            >
              ← Back
            </Link>

            <div className="flex items-center gap-2">
              <Chip>TMDB</Chip>
              <Chip>Vidking</Chip>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 pb-12">
            <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-2xl backdrop-blur">
                  {poster ? (
                    <img src={poster} alt={title} className="w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-[460px] items-center justify-center text-white/50">No poster</div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {isMovie ? (
                    <PrimaryButton to={`/play/movie/${tmdbId}`}>▶ Play</PrimaryButton>
                  ) : (
                    <SecondaryButton
                      onClick={() => {
                        const el = document.getElementById("episodes");
                        el?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    >
                      ☰ Episodes
                    </SecondaryButton>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
                    {year ? <Chip>{year}</Chip> : null}
                    {isMovie && (data as TmdbMovie | null)?.runtime ? (
                      <Chip>{(data as TmdbMovie).runtime} min</Chip>
                    ) : null}
                    {isTv && (data as TmdbTv | null)?.number_of_seasons ? (
                      <Chip>{(data as TmdbTv).number_of_seasons} seasons</Chip>
                    ) : null}
                    {genres.slice(0, 4).map((g: string) => (
                      <Chip key={g}>{g}</Chip>
                    ))}
                  </div>

                  {tagline ? <div className="max-w-2xl text-sm text-white/75">{tagline}</div> : null}

                  <p className="max-w-2xl leading-relaxed text-white/85">{(data as any)?.overview || "No overview."}</p>
                </div>
              </div>
            </div>

            {isTv ? (
              <section id="episodes" className="mt-12">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-2xl font-semibold tracking-tight">Episodes</div>
                    <div className="mt-1 text-sm text-white/60">Pick a season and choose an episode.</div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold text-white/80">Season</div>

                      <SeasonDropdown seasons={seasonOptions} value={seasonNumber} onChange={(n) => setSeasonNumber(n)} />
                    </div>

                    <div className="relative w-full md:max-w-md">
                      <input
                        value={episodeFilter}
                        onChange={(e) => setEpisodeFilter(e.target.value)}
                        placeholder="Search episode…"
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/20"
                      />
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">
                        {searchingAll && prefetchProgress.total > 0
                          ? `${episodes.length} • ${Math.min(prefetchProgress.loaded, prefetchProgress.total)}/${prefetchProgress.total}`
                          : loadingSeason
                          ? "Loading…"
                          : `${episodes.length}`}
                      </div>
                    </div>
                  </div>

                  {searchingAll ? (
                    <div className="mt-3 text-xs text-white/45">
                      Searching all seasons
                      {prefetchProgress.total > 0
                        ? ` (${Math.min(prefetchProgress.loaded, prefetchProgress.total)}/${prefetchProgress.total} loaded)…`
                        : "…"}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 relative">
                  <div className={loadingSeason ? "opacity-50 pointer-events-none" : ""}>
                    {(seasonData as ErrorLike | null)?.__error ? (
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-red-200">
                        Failed to load season.
                      </div>
                    ) : episodes?.length ? (
                      <div className="space-y-3">
                        {episodes.map((ep: TmdbEpisode & { __season?: number }) => {
                          const still = img(ep.still_path, "w500");
                          const epSeason = ep.__season ?? seasonNumber;

                          return (
                            <Link
                              key={`${epSeason}-${ep.id}`}
                              to={`/play/tv/${tmdbId}/${epSeason}/${ep.episode_number}`}
                              className="group block rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur transition hover:border-white/20 hover:bg-black/30"
                            >
                              <div className="flex gap-4">
                                <div className="relative w-40 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30 sm:w-52 aspect-video">
                                  {still ? (
                                    <img
                                      src={still}
                                      alt={ep.name}
                                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-white/50">
                                      No image
                                    </div>
                                  )}
                                  <div className="absolute left-2 top-2 rounded-full border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-white/85">
                                    {isCrossSeason ? `S${epSeason} · ` : ""}
                                    E{ep.episode_number}
                                  </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="line-clamp-1 text-sm font-semibold text-white">
                                        {ep.name || `Episode ${ep.episode_number}`}
                                      </div>
                                      <div className="mt-1 line-clamp-2 text-xs text-white/65">
                                        {ep.overview || "—"}
                                      </div>
                                    </div>

                                    <div className="shrink-0 rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-xs text-white/85 opacity-0 transition group-hover:opacity-100">
                                      ▶ Play
                                    </div>
                                  </div>

                                  {ep.air_date ? (
                                    <div className="mt-2 text-[11px] text-white/45">{ep.air_date}</div>
                                  ) : null}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/70">
                        No episodes found.
                      </div>
                    )}
                  </div>

                  {loadingSeason ? (
                    <div className="absolute inset-0 flex items-start justify-center pt-6">
                      <div className="rounded-2xl border border-white/10 bg-black/50 px-4 py-2 text-sm text-white/80 backdrop-blur">
                        Loading episodes…
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
