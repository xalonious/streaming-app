import { type SearchResult } from "../api/tmdb";
import { StarIcon, PlayIcon, InfoIcon } from "./Icons";

export function HeroSection({ item, onPlay, onDetails }: {
  item: SearchResult;
  onPlay: () => void;
  onDetails: () => void;
}) {
  const backdrop = item.backdrop ?? item.poster;
  return (
    <section className="relative w-full" style={{ height: "91vh", minHeight: 500 }}>
      {backdrop && (
        <div className="absolute inset-0">
          <img src={backdrop} alt="" className="w-full h-full object-cover object-center" loading="eager" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.05) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.85) 18%, transparent 55%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 20%)" }} />
        </div>
      )}
      <div className="absolute bottom-0 left-0 z-10 px-10 sm:px-16 pb-14 max-w-2xl">
        <div className="flex items-center flex-wrap gap-2 mb-3 text-xs text-zinc-300">
          {item.vote_average && (
            <span className="flex items-center gap-1">
              <StarIcon />
              <span className="text-yellow-400 font-semibold">{item.vote_average.toFixed(1)}</span>
            </span>
          )}
          {item.year && <><span className="text-zinc-600">|</span><span>{item.year}</span></>}
          {(item as any).genres?.slice(0, 3).map((g: string) => (
            <><span className="text-zinc-600">|</span><span key={g}>{g}</span></>
          ))}
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-3 tracking-tight">{item.title}</h1>
        {(item as any).overview && (
          <p className="text-sm text-zinc-300/85 leading-relaxed mb-6 line-clamp-3 max-w-lg">{(item as any).overview}</p>
        )}
        <div className="flex items-center gap-3">
          <button onClick={onPlay} className="flex items-center gap-2 bg-white text-black font-bold text-sm rounded-xl px-7 py-2.5 hover:bg-zinc-100 transition-all active:scale-95">
            <PlayIcon size={15} /> Play
          </button>
          <button onClick={onDetails} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm rounded-xl px-5 py-2.5 hover:bg-white/20 transition-all">
            <InfoIcon /> See More
          </button>
        </div>
      </div>
    </section>
  );
}