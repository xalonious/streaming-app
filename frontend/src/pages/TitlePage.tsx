import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Chip } from "../components/Chip";
import { PrimaryLinkButton, SecondaryButton } from "../components/Buttons";
import { SeasonDropdown } from "../components/SeasonDropdown";
import { useTitleDetails, type TmdbMovie, type TmdbTv, type ErrorLike } from "../hooks/useTitleDetails";
import { useSeasonEpisodes } from "../hooks/useSeasonEpisodes";
import { useCrossSeasonEpisodeSearch } from "../hooks/useCrossSeasonEpisodeSearch";

export default function TitlePage() {
  const { type, id } = useParams();
  const tmdbId = Number(id);

  const {
    data,
    loading,
    isError,
    isTv,
    isMovie,
    title,
    tagline,
    year,
    genres,
    posterUrl: poster,
    backdropUrl: backdrop,
    seasonOptions,
    initialSeasonNumber,
  } = useTitleDetails(tmdbId, type);

  const [seasonNumber, setSeasonNumber] = useState<number>(1);
  const [episodeFilter, setEpisodeFilter] = useState("");

  useEffect(() => {
    if (!isTv || isError || !data) return;
    setSeasonNumber(initialSeasonNumber ?? 1);
    setEpisodeFilter("");
  }, [isTv, isError, data, initialSeasonNumber]);

  const { seasonData, loadingSeason } = useSeasonEpisodes({
    tmdbId,
    enabled: isTv && !isError,
    seasonNumber,
  });

  useEffect(() => {
    setEpisodeFilter("");
  }, [tmdbId, type]);

  const { episodes, isCrossSeason, searchingAll, prefetchProgress } =
    useCrossSeasonEpisodeSearch({
      tmdbId,
      enabled: isTv && !isError,
      seasonNumber,
      seasonData,
      episodeFilter,
    });

  const runtime = isMovie ? (data as TmdbMovie | null)?.runtime : undefined;
  const numberOfSeasons = isTv
    ? (data as TmdbTv | null)?.number_of_seasons
    : undefined;

  if (loading || !data) {
    return (
      <div className="min-h-[100svh] bg-zinc-950 text-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-zinc-400">
          Loading…
        </div>
      </div>
    );
  }

  if (isError || (data as ErrorLike).__error) {
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
            <img
              src={backdrop}
              alt=""
              className="h-[100svh] w-full object-cover"
              loading="lazy"
            />
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
                    <img
                      src={poster}
                      alt={title}
                      className="w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-[460px] items-center justify-center text-white/50">
                      No poster
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {isMovie ? (
                    <PrimaryLinkButton to={`/play/movie/${tmdbId}`}>
                      ▶ Play
                    </PrimaryLinkButton>
                  ) : (
                    <SecondaryButton
                      onClick={() => {
                        const el = document.getElementById("episodes");
                        el?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                    >
                      ☰ Episodes
                    </SecondaryButton>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                    {title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
                    {year ? <Chip>{year}</Chip> : null}
                    {isMovie && runtime ? <Chip>{runtime} min</Chip> : null}
                    {isTv && numberOfSeasons ? (
                      <Chip>{numberOfSeasons} seasons</Chip>
                    ) : null}
                    {genres.slice(0, 4).map((g) => (
                      <Chip key={g}>{g}</Chip>
                    ))}
                  </div>

                  {tagline ? (
                    <div className="max-w-2xl text-sm text-white/75">
                      {tagline}
                    </div>
                  ) : null}

                  <p className="max-w-2xl leading-relaxed text-white/85">
                    {(data as any)?.overview || "No overview."}
                  </p>
                </div>
              </div>
            </div>

            {isTv ? (
              <section id="episodes" className="mt-12">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-2xl font-semibold tracking-tight">
                      Episodes
                    </div>
                    <div className="mt-1 text-sm text-white/60">
                      Pick a season and choose an episode.
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold text-white/80">
                        Season
                      </div>

                      <SeasonDropdown
                        seasons={seasonOptions}
                        value={seasonNumber}
                        onChange={(n) => setSeasonNumber(n)}
                      />
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
                          ? `${episodes.length} • ${Math.min(
                              prefetchProgress.loaded,
                              prefetchProgress.total
                            )}/${prefetchProgress.total}`
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
                        ? ` (${Math.min(
                            prefetchProgress.loaded,
                            prefetchProgress.total
                          )}/${prefetchProgress.total} loaded)…`
                        : "…"}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 relative">
                  <div
                    className={loadingSeason ? "opacity-50 pointer-events-none" : ""}
                  >
                    {(seasonData as ErrorLike | null)?.__error ? (
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-red-200">
                        Failed to load season.
                      </div>
                    ) : episodes?.length ? (
                      <div className="space-y-3">
                        {episodes.map((ep) => {
                          const epSeason = ep.season;
                          const still = ep.still;

                          return (
                            <Link
                              key={`${epSeason}-${ep.id}`}
                              to={`/play/tv/${tmdbId}/${epSeason}/${ep.episode}`}
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
                                    E{ep.episode}
                                  </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="line-clamp-1 text-sm font-semibold text-white">
                                        {ep.name || `Episode ${ep.episode}`}
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
                                    <div className="mt-2 text-[11px] text-white/45">
                                      {ep.air_date}
                                    </div>
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
