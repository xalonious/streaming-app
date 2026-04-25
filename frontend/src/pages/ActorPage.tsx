import { useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePersonDetails } from "../hooks/usePersonDetails";
import { type SearchResult } from "../api/tmdb";
import { ChevronLeft, ChevronRight, StarIcon } from "../components/ui/Icons";

const PROFILE_BASE = "https://image.tmdb.org/t/p/w300";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1 h-5 rounded-full bg-[#e50914]" />
      <h2 className="text-white font-bold text-base sm:text-lg">{children}</h2>
    </div>
  );
}

function CreditCarousel({ title, credits }: { title: string; credits: SearchResult[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -500 : 500, behavior: "smooth" });
  if (!credits.length) return null;
  return (
    <section className="mb-10 px-4 sm:px-6">
      <SectionHeading>{title}</SectionHeading>
      <div className="relative group/carousel">
        <button onClick={() => scroll("left")} className="absolute left-0 top-[38%] -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 flex items-center justify-center bg-black/90 rounded-full border border-white/15 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200">
          <ChevronLeft />
        </button>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {credits.map((credit: SearchResult) => {
            return (
              <Link
                key={`${credit.type}-${credit.id}`}
                to={`/title/${credit.type}/${credit.id}`}
                className="group/card flex-shrink-0 block"
                style={{ width: 160 }}
              >
                <div className="relative rounded-xl overflow-hidden ring-1 ring-white/10 group-hover/card:ring-white/30 transition-all duration-200 group-hover/card:scale-[1.02]">
                  {credit.poster ? (
                    <img src={credit.poster} alt={credit.title} className="w-full aspect-[2/3] object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-zinc-800 flex items-center justify-center text-xs text-zinc-500 p-2 text-center">{credit.title}</div>
                  )}
                </div>
                <div className="mt-2.5 px-0.5">
                  <div className="text-white text-sm font-semibold truncate">{credit.title}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-400">
                    {!!credit.vote_average && credit.vote_average >= 1 && (
                      <span className="flex items-center gap-1"><StarIcon /><span className="text-zinc-300">{credit.vote_average.toFixed(1)}</span></span>
                    )}
                    {credit.year && <><span className="text-zinc-600">·</span><span>{credit.year}</span></>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <button onClick={() => scroll("right")} className="absolute right-0 top-[38%] -translate-y-1/2 translate-x-5 z-10 w-10 h-10 flex items-center justify-center bg-black/90 rounded-full border border-white/15 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200">
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}

export default function ActorPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, loading, error } = usePersonDetails(Number(id));

  useEffect(() => {
    if (data?.name) document.title = data.name;
    return () => { document.title = ""; };
  }, [data]);

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

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-4">Failed to load actor.</p>
          <Link to="/" className="text-sm text-zinc-300 hover:text-white underline">← Back to home</Link>
        </div>
      </div>
    );
  }

  const profileImg = data.profile_path ? `${PROFILE_BASE}${data.profile_path}` : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <button
        onClick={() => nav(-1)}
        className="absolute top-5 left-6 z-10 w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/15 rounded-full text-white transition-all"
      >
        <ChevronLeft />
      </button>

      <div className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-14 pt-20 pb-10">
          <div className="flex gap-10 items-start">
            <div className="flex-shrink-0 w-44 h-56 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-zinc-800">
              {profileImg ? (
                <img src={profileImg} alt={data.name} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl text-zinc-600">?</div>
              )}
            </div>
            <div className="flex-1 pt-1">
              {data.known_for_department && (
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#e50914] mb-3">{data.known_for_department}</div>
              )}
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none mb-5">{data.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-6">
                {data.birthday && (
                  <div className="text-zinc-400">Born <span className="text-zinc-200 font-medium">{new Date(data.birthday).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span></div>
                )}
                {data.place_of_birth && (
                  <div className="flex items-center gap-2 text-zinc-400"><span className="text-zinc-700">·</span><span className="text-zinc-200 font-medium">{data.place_of_birth}</span></div>
                )}
              </div>
              {data.biography && (
                <p className="text-sm text-zinc-400 leading-relaxed">{data.biography}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pb-16 pt-8 mx-auto max-w-[1400px]">
        <CreditCarousel title="Known for" credits={data.knownFor} />
        <CreditCarousel title="Movies" credits={data.movies} />
        <CreditCarousel title="TV Shows" credits={data.shows} />
      </div>
    </div>
  );
}