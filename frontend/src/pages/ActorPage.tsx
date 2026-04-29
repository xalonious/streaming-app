import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePersonDetails } from "../hooks/usePersonDetails";
import { type SearchResult } from "../api/tmdb";
import { ChevronLeft } from "../components/ui/Icons";
import { PosterCarousel } from "../components/rows/PosterCarousel";

const PROFILE_BASE = "https://image.tmdb.org/t/p/w300";

export default function ActorPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, loading, error } = usePersonDetails(Number(id));
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    if (data?.name) document.title = data.name;
    return () => { document.title = ""; };
  }, [data]);

  useEffect(() => {
    setBioExpanded(false);
  }, [id]);

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
  const openTitle = (item: SearchResult) => nav(`/title/${item.type}/${item.id}`);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <button
        onClick={() => nav(-1)}
        className="absolute top-4 left-4 sm:top-5 sm:left-6 z-10 w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/15 rounded-full text-white transition-all"
      >
        <ChevronLeft />
      </button>

      <div className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-14 pt-16 sm:pt-20 pb-8 sm:pb-10">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-center sm:items-start">
            <div className="flex-shrink-0 w-40 h-52 sm:w-44 sm:h-56 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl bg-zinc-800">
              {profileImg ? (
                <img src={profileImg} alt={data.name} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl text-zinc-600">?</div>
              )}
            </div>
            <div className="w-full flex-1 pt-0 sm:pt-1 text-center sm:text-left">
              {data.known_for_department && (
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#e50914] mb-2 sm:mb-3">{data.known_for_department}</div>
              )}
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[0.95] mb-4 sm:mb-5 break-words">{data.name}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 sm:gap-x-4 gap-y-1 text-sm mb-5 sm:mb-6">
                {data.birthday && (
                  <div className="text-zinc-400">Born <span className="text-zinc-200 font-medium">{new Date(data.birthday).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span></div>
                )}
                {data.place_of_birth && (
                  <div className="flex items-center gap-2 text-zinc-400"><span className="text-zinc-700">·</span><span className="text-zinc-200 font-medium">{data.place_of_birth}</span></div>
                )}
              </div>
              {data.biography && (
                <div className="relative mx-auto sm:mx-0 max-w-xl sm:max-w-none">
                  <p className={`text-left text-sm text-zinc-400 leading-relaxed ${bioExpanded ? "" : "max-h-44 sm:max-h-none overflow-hidden"}`}>{data.biography}</p>
                  {!bioExpanded && (
                    <>
                      <div className="sm:hidden pointer-events-none absolute inset-x-0 bottom-8 h-16 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                      <button
                        onClick={() => setBioExpanded(true)}
                        className="sm:hidden relative mt-3 text-xs font-semibold text-zinc-200 hover:text-white bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        Read more
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pb-16 pt-6 sm:pt-8 mx-auto max-w-[1400px]">
        <PosterCarousel title="Known for" items={data.knownFor} onOpen={openTitle} sectionClassName="mb-8 sm:mb-10 px-4 sm:px-6" />
        <PosterCarousel title="Movies" items={data.movies} onOpen={openTitle} sectionClassName="mb-8 sm:mb-10 px-4 sm:px-6" />
        <PosterCarousel title="TV Shows" items={data.shows} onOpen={openTitle} sectionClassName="mb-8 sm:mb-10 px-4 sm:px-6" />
      </div>
    </div>
  );
}
