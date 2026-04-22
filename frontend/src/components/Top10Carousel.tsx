import { useRef } from "react";
import { type SearchResult } from "../api/tmdb";
import { ChevronLeft, ChevronRight, StarIcon } from "./Icons";

export function Top10Carousel({ items, onOpen }: {
  items: SearchResult[];
  onOpen: (item: SearchResult) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const top10 = items.slice(0, 10);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -500 : 500, behavior: "smooth" });
  };

  return (
    <section className="px-4 sm:px-6 pt-4 pb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-5 rounded-full bg-[#e50914]" />
        <h2 className="text-white font-bold text-base sm:text-lg">TOP 10 Today</h2>
      </div>
      <div className="relative group/carousel">
        <button onClick={() => scroll("left")} className="absolute left-0 top-[38%] -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 flex items-center justify-center bg-black/90 rounded-full border border-white/15 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200">
          <ChevronLeft />
        </button>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {top10.map((item, idx) => (
            <button key={item.id} onClick={() => onOpen(item)} className="flex-shrink-0 group/card text-left" style={{ width: 200 }}>
              <div className="relative rounded-xl overflow-hidden ring-1 ring-white/10 group-hover/card:ring-white/30 transition-all duration-200 group-hover/card:scale-[1.02]">
                {item.poster ? (
                  <img src={item.poster} alt={item.title} className="w-full aspect-[2/3] object-cover" loading="lazy" />
                ) : (
                  <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-xs text-zinc-500 p-2 text-center">{item.title}</div>
                )}
                <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 border border-white/20 flex items-center justify-center">
                  <span className="text-white text-xs font-black">{idx + 1}</span>
                </div>
              </div>
              <div className="mt-2.5 px-0.5">
                <div className="text-white text-sm font-semibold truncate">{item.title}</div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-400 flex-wrap">
                  {!!item.vote_average && item.vote_average >= 1 && (
                    <span className="flex items-center gap-1"><StarIcon /><span className="text-zinc-300">{item.vote_average.toFixed(1)}</span></span>
                  )}
                  {item.year && <><span className="text-zinc-600">·</span><span>{item.year}</span></>}
                  <span className="text-zinc-600">·</span>
                  <span>{item.type === "tv" ? "TV Show" : "Movie"}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => scroll("right")} className="absolute right-0 top-[38%] -translate-y-1/2 translate-x-5 z-10 w-10 h-10 flex items-center justify-center bg-black/90 rounded-full border border-white/15 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200">
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}