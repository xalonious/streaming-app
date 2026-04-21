import { useEffect, useRef } from "react";
import { type SearchResult } from "../api/tmdb";
import { ChevronLeft, ChevronRight, StarIcon } from "./Icons";

export function TopRatedRow({ items, onOpen, type, onTypeChange }: {
  items: SearchResult[];
  onOpen: (item: SearchResult) => void;
  type: "movie" | "tv";
  onTypeChange: (t: "movie" | "tv") => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [type]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -640 : 640, behavior: "smooth" });
  };

  return (
    <section className="px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 rounded-full bg-[#e50914]" />
          <h2 className="text-white font-bold text-base sm:text-lg">Top rated</h2>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white/[0.06] rounded-xl border border-white/10">
          <button
            onClick={() => onTypeChange("movie")}
            className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition ${type === "movie" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
          >Movies</button>
          <button
            onClick={() => onTypeChange("tv")}
            className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition ${type === "tv" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
          >Series</button>
        </div>
      </div>

      <div className="relative group/carousel">
        <button onClick={() => scroll("left")} className="absolute left-0 top-[38%] -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 flex items-center justify-center bg-black/90 rounded-full border border-white/15 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200">
          <ChevronLeft />
        </button>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onOpen(item)}
              className="flex-shrink-0 group/card text-left"
              style={{ width: 200 }}
            >
              <div className="relative rounded-xl overflow-hidden ring-1 ring-white/10 group-hover/card:ring-white/30 transition-all duration-200 group-hover/card:scale-[1.02]">
                {item.poster ? (
                  <img src={item.poster} alt={item.title} className="w-full aspect-[2/3] object-cover" loading="lazy" />
                ) : (
                  <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-xs text-zinc-500 p-2 text-center">{item.title}</div>
                )}
              </div>
              <div className="mt-2.5 px-0.5">
                <div className="text-white text-sm font-semibold truncate">{item.title}</div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-400 flex-wrap">
                  {item.vote_average && item.vote_average >= 1 && (
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