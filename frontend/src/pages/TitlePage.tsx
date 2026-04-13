import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useRecommendations } from "../hooks/useRecommendations";
import { PlayIcon, StarIcon, SearchIcon, CloseIcon } from "../components/Icons";
import { useTitleMeta } from "../hooks/useTitleMeta";
import { ActorCard } from "../components/ActorCard";
import { SeasonDropdown } from "../components/SeasonDropdown";
import { useTitleDetails, type ErrorLike } from "../hooks/useTitleDetails";
import { useSeasonEpisodes } from "../hooks/useSeasonEpisodes";
import { useCrossSeasonEpisodeSearch } from "../hooks/useCrossSeasonEpisodeSearch";


function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1 h-5 rounded-full bg-[#e50914]" />
      <h2 className="text-white font-bold text-base sm:text-lg">{children}</h2>
    </div>
  );
}

export default function TitlePage() {
  const { type, id } = useParams();
  const nav = useNavigate();
  const tmdbId = Number(id);

  const {
    data, loading, isError, isTv, isMovie,
    title, year, genres,
    backdropUrl: backdrop,
    seasonOptions, initialSeasonNumber,
  } = useTitleDetails(tmdbId, type);

  const [seasonNumber, setSeasonNumber] = useState<number>(1);
  const [episodeFilter, setEpisodeFilter] = useState("");
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    document.title = loading ? "Loading…" : title ? (year ? `${title} (${year})` : title) : "";
    return () => { document.title = ""; };
  }, [loading, title, year]);

  useEffect(() => {
    if (!isTv || isError || !data) return;
    setSeasonNumber(initialSeasonNumber ?? 1);
    setEpisodeFilter("");
  }, [isTv, isError, data, initialSeasonNumber]);

  useEffect(() => {
    setEpisodeFilter("");
    setShowTrailer(false);
  }, [tmdbId, type]);

  useEffect(() => {
    if (!showTrailer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowTrailer(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showTrailer]);

  const { seasonData, loadingSeason, setSeasonCache } = useSeasonEpisodes({
    tmdbId, enabled: isTv && !isError, seasonNumber,
  });

  const { episodes, isCrossSeason, searchingAll, prefetchProgress } = useCrossSeasonEpisodeSearch({
    tmdbId, enabled: isTv && !isError, seasonNumber, seasonData, episodeFilter, setSeasonCache,
  });

  const { runtime, numberOfSeasons, rating, trailer, trailerEmbedUrl, trailerModalUrl, fullCast } = useTitleMeta(data, isMovie, isTv);

  const recommendations = useRecommendations(tmdbId, type);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400 text-sm">
          <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (isError || (data as ErrorLike).__error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-4">Failed to load title.</p>
          <Link to="/" className="text-sm text-zinc-300 hover:text-white underline">← Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="relative w-full" style={{ height: "78vh", minHeight: 480 }}>
        <div className="absolute inset-0 overflow-hidden">
          {trailerEmbedUrl ? (
            <iframe
              src={trailerEmbedUrl}
              title="bg"
              allow="autoplay; encrypted-media"
              style={{ position: "absolute", top: "50%", left: "50%", width: "120vw", height: "67.5vw", minWidth: "100vw", minHeight: "100%", transform: "translate(-50%,-50%)", border: 0, pointerEvents: "none" }}
            />
          ) : backdrop ? (
            <img src={backdrop} alt="" className="w-full h-full object-cover object-center" loading="eager" />
          ) : (
            <div className="w-full h-full bg-zinc-900" />
          )}
        </div>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.6) 35%, transparent 65%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 20%)" }} />
        <button
          onClick={() => nav(-1)}
          className="absolute top-5 left-6 z-10 w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/15 rounded-full text-white transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="absolute bottom-0 left-0 right-0 z-10 px-6 sm:px-10 pb-12 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-3">{title}</h1>
          <div className="flex flex-wrap items-center gap-2 mb-3 text-sm text-zinc-300">
            {rating && (
              <span className="flex items-center gap-1.5">
                <StarIcon />
                <span className="font-semibold text-white">{rating}</span>
              </span>
            )}
            {year && <><span className="text-zinc-600">|</span><span>{year}</span></>}
            {isMovie && runtime && <><span className="text-zinc-600">|</span><span>{runtime} min</span></>}
            {isTv && numberOfSeasons && <><span className="text-zinc-600">|</span><span>{numberOfSeasons} season{numberOfSeasons > 1 ? "s" : ""}</span></>}
            {genres.slice(0, 3).map((g) => (
              <span key={g} className="contents"><span className="text-zinc-600">|</span><span>{g}</span></span>
            ))}
          </div>
          {(data as any)?.overview && (
            <p className="text-sm text-zinc-300/90 leading-relaxed mb-6 max-w-lg line-clamp-3">
              {(data as any).overview}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {isMovie ? (
              <Link
                to={`/play/movie/${tmdbId}`}
                className="flex items-center gap-2 bg-white text-black font-bold text-sm rounded-xl px-7 py-2.5 hover:bg-zinc-100 transition-all active:scale-95"
              >
                <PlayIcon size={15} /> Play
              </Link>
            ) : (
              <button
                onClick={() => document.getElementById("episodes")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="flex items-center gap-2 bg-white text-black font-bold text-sm rounded-xl px-7 py-2.5 hover:bg-zinc-100 transition-all active:scale-95"
              >
                ☰ Episodes
              </button>
            )}
            {trailerModalUrl && (
              <button
                onClick={() => setShowTrailer(true)}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm rounded-xl px-5 py-2.5 hover:bg-white/20 transition-all"
              >
                <PlayIcon size={13} /> Trailer
              </button>
            )}

          </div>
        </div>
      </div>
      <div className="px-6 sm:px-14 pb-16 pt-10">
        {isTv && (
          <section id="episodes" className="mb-12">
            <SectionHeading>Episodes</SectionHeading>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <SeasonDropdown seasons={seasonOptions} value={seasonNumber} onChange={setSeasonNumber} />
              <div className="relative flex-1 max-w-xs">
                <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={episodeFilter}
                  onChange={e => setEpisodeFilter(e.target.value)}
                  placeholder="Search episode…"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-4 py-2.5 text-sm text-white outline-none placeholder-zinc-500 focus:border-white/25 transition-colors"
                />
              </div>
              <span className="text-xs text-zinc-600">
                {searchingAll && prefetchProgress.total > 0
                  ? `${Math.min(prefetchProgress.loaded, prefetchProgress.total)}/${prefetchProgress.total} seasons loaded`
                  : loadingSeason ? "" : `${episodes.length} episodes`}
              </span>
            </div>
            <div className={`relative transition-opacity ${loadingSeason ? "opacity-40 pointer-events-none" : ""}`} style={{ maxHeight: "600px", overflowY: "auto", overflowX: "hidden", scrollbarWidth: "thin", scrollbarColor: "#e50914 transparent" }}>
              {(seasonData as ErrorLike | null)?.__error ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-red-300">Failed to load season.</div>
              ) : episodes?.length ? (
                <div className="divide-y divide-white/[0.05]">
                  {episodes.map(ep => (
                    <Link
                      key={`${ep.season}-${ep.id}`}
                      to={`/play/tv/${tmdbId}/${ep.season}/${ep.episode}`}
                      className="group flex items-center gap-4 py-3 hover:bg-white/[0.03] rounded-xl px-2 -mx-2 transition-colors"
                    >
                      <div className="relative flex-shrink-0 w-36 sm:w-44 aspect-video rounded-xl overflow-hidden bg-black/40">
                        {ep.still ? (
                          <img src={ep.still} alt={ep.name} className="w-full h-full object-cover transition group-hover:scale-[1.04]" loading="lazy" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-zinc-600">No image</div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                            <PlayIcon size={13} />
                          </div>
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 bg-black/70 rounded px-1.5 py-0.5 text-[10px] text-zinc-300 font-medium">
                          {isCrossSeason ? `S${ep.season}·` : ""}E{ep.episode}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white mb-0.5 truncate">
                          {ep.name || `Episode ${ep.episode}`}
                        </div>
                        {ep.runtime && (
                          <div className="text-xs text-zinc-500 mb-1">{ep.runtime} min</div>
                        )}
                        <div className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {ep.overview || "—"}
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-sm text-zinc-500">No episodes found.</div>
              )}

              {loadingSeason && (
                <div className="absolute inset-0 flex items-start justify-center pt-10">
                  <div className="flex items-center gap-2 bg-black/70 backdrop-blur rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300">
                    <div className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                    Loading episodes…
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        {fullCast.length > 0 && (
          <section>
            <SectionHeading>Actors</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {fullCast.slice(0, 18).map(p => (
                <ActorCard key={p.id} actor={p} />
              ))}
            </div>
          </section>
        )}
        {recommendations.length > 0 && (
          <section className="mt-12">
            <SectionHeading>You may like</SectionHeading>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
              {recommendations.slice(0, 18).map(item => (
                <Link
                  key={item.id}
                  to={`/title/${item.type}/${item.id}`}
                  className="group block"
                >
                  <div className="relative rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-white/30 transition-all duration-200 group-hover:scale-[1.03]">
                    {item.backdrop ?? item.poster ? (
                      <img
                        src={(item.backdrop ?? item.poster)!}
                        alt={item.title}
                        className="w-full aspect-video object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">{item.title}</div>
                    )}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
                    <div className="absolute top-2 left-2 flex items-center justify-between w-[calc(100%-16px)]">
                      <span className="text-[10px] bg-black/60 border border-white/20 rounded px-1.5 py-0.5 text-zinc-300 uppercase tracking-wide font-medium">
                        {item.type === "tv" ? "TV Show" : "Movie"}
                      </span>
                      {item.vote_average && (
                        <span className="flex items-center gap-1 bg-black/60 border border-white/20 rounded px-1.5 py-0.5">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#e50914"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          <span className="text-[10px] text-zinc-200 font-semibold">{item.vote_average.toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="text-white text-xs font-bold line-clamp-1">{item.title}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}


      </div>
      {showTrailer && trailerModalUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={() => setShowTrailer(false)}>
          <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-300 truncate">{trailer?.name ?? "Trailer"}</span>
              <button
                onClick={() => setShowTrailer(false)}
                className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full border border-white/15 text-zinc-400 hover:text-white transition ml-3"
              >
                <CloseIcon size={14} />
              </button>
            </div>
            <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
              <iframe src={trailerModalUrl} title={trailer?.name ?? "Trailer"} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="w-full h-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}