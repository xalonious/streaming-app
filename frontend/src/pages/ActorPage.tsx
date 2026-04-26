import { useEffect } from "react";
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
  const openTitle = (item: SearchResult) => nav(`/title/${item.type}/${item.id}`);

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
        <PosterCarousel title="Known for" items={data.knownFor} onOpen={openTitle} sectionClassName="mb-10 px-4 sm:px-6" />
        <PosterCarousel title="Movies" items={data.movies} onOpen={openTitle} sectionClassName="mb-10 px-4 sm:px-6" />
        <PosterCarousel title="TV Shows" items={data.shows} onOpen={openTitle} sectionClassName="mb-10 px-4 sm:px-6" />
      </div>
    </div>
  );
}
