import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useRecommendations } from "../hooks/useRecommendations";
import { PlayIcon, StarIcon, SearchIcon, ChevronLeft } from "../components/ui/Icons";
import { useTitleMeta } from "../hooks/useTitleMeta";
import { ActorCard } from "../components/cards/ActorCard";
import { SeasonDropdown } from "../components/ui/SeasonDropdown";
import { TrailerModal } from "../components/ui/TrailerModal";
import { RecommendationsGrid } from "../components/rows/RecommendationsGrid";
import { useTitleDetails, type ErrorLike } from "../hooks/useTitleDetails";
import { useSeasonEpisodes } from "../hooks/useSeasonEpisodes";
import { useCrossSeasonEpisodeSearch } from "../hooks/useCrossSeasonEpisodeSearch";
import { useCollection } from "../hooks/useCollection";

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
    title, year, overview, genres,
    backdropUrl: backdrop,
    posterUrl,
    seasonOptions, initialSeasonNumber,
  } = useTitleDetails(tmdbId, type);

  const [seasonNumber, setSeasonNumber] = useState<number>(1);
  const [episodeFilter, setEpisodeFilter] = useState("");
  const [showTrailer, setShowTrailer] = useState(false);

  const [prevKey, setPrevKey] = useState(`${type}-${id}`);
  if (`${type}-${id}` !== prevKey) {
    setPrevKey(`${type}-${id}`);
    setEpisodeFilter("");
    setShowTrailer(false);
  }

  const [prevData, setPrevData] = useState(data);
  if (isTv && !isError && data && data !== prevData) {
    setPrevData(data);
    setSeasonNumber(initialSeasonNumber ?? 1);
    setEpisodeFilter("");
  }

  useEffect(() => {
    document.title = loading ? "Loading…" : title ? (year ? `${title} (${year})` : title) : "";
    return () => { document.title = ""; };
  }, [loading, title, year]);

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

  const { runtime, numberOfSeasons, rating, trailer, trailerEmbedUrl, trailerModalUrl, fullCast, logoUrl } = useTitleMeta(data, isMovie, isTv, tmdbId, type);

  const collectionSummary = isMovie && data && !(data as ErrorLike).__error
    ? (data as any).belongs_to_collection
    : null;
  const collection = useCollection(collectionSummary?.id);
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
          <ChevronLeft />
        </button>
        <div className="absolute bottom-0 left-0 right-0 z-10 px-6 sm:px-10 pb-12 max-w-2xl">
          {logoUrl ? (
            <img src={logoUrl} alt={title} className="h-20 sm:h-28 w-auto object-contain mb-4 drop-shadow-2xl" style={{ maxWidth: "400px" }} />
          ) : (
            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-3">{title}</h1>
          )}
          <div className="flex flex-wrap items-center gap-2 mb-3 text-sm text-zinc-300">
            {rating && (
              <span className="flex items-center gap-1.5">
                <StarIcon />
                <span className="font-semibold text-white">{rating}</span>
              </span>
            )}
            {year && <>{rating && <span className="text-zinc-600">|</span>}<span>{year}</span></>}
            {isMovie && !!runtime && <><span className="text-zinc-600">|</span><span>{runtime} min</span></>}
            {isTv && !!numberOfSeasons && <><span className="text-zinc-600">|</span><span>{numberOfSeasons} season{numberOfSeasons > 1 ? "s" : ""}</span></>}
            {genres.slice(0, 3).map((g) => (
              <span key={g} className="contents"><span className="text-zinc-600">|</span><span>{g}</span></span>
            ))}
          </div>
          {overview && (
            <p className="text-sm text-zinc-300/90 leading-relaxed mb-6 max-w-lg line-clamp-3">
              {overview}
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
                        ) : posterUrl ? (
                          <img src={posterUrl} alt={title} className="w-full h-full object-cover object-top transition group-hover:scale-[1.04]" loading="lazy" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-zinc-600">No image</div>
                        )}
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
        {collection && collection.parts.length > 1 && (
          <RecommendationsGrid
            title={`Watch the whole ${collection.name}`}
            items={collection.parts}
          />
        )}
        <RecommendationsGrid items={recommendations} />
      </div>
      {showTrailer && trailerModalUrl && (
        <TrailerModal
          url={trailerModalUrl}
          name={trailer?.name}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </div>
  );
}
