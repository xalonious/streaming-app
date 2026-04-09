import { useRef } from "react";
import { type SearchResult } from "../api/tmdb";
import { ChevronLeft, ChevronRight, StarIcon } from "./Icons";

export function TrendingRow({ items, onOpen, trendWindow, onTrendWindowChange }: {
  items: SearchResult[];
  onOpen: (item: SearchResult) => void;
  trendWindow: "day" | "week";
  onTrendWindowChange: (w: "day" | "week") => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -640 : 640, behavior: "smooth" });
  };

  return (
    <section className="px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 rounded-full bg-[#e50914]" />
          <h2 className="text-white font-bold text-base sm:text-lg">
            Trending <span className="text-zinc-400 font-normal">{trendWindow === "day" ? "Today" : "This Week"}</span>
          </h2>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white/[0.06] rounded-xl border border-white/10">
          <button
            onClick={() => onTrendWindowChange("day")}
            className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition ${trendWindow === "day" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
          >Movies</button>
          <button
            onClick={() => onTrendWindowChange("week")}
            className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition ${trendWindow === "week" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
          >Series</button>
        </div>
      </div>

      <div className="relative group/carousel">
        <button onClick={() => scroll("left")} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 flex items-center justify-center bg-black/90 rounded-full border border-white/15 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200">
          <ChevronLeft />
        </button>
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {items.map((item) => {
            const backdrop = item.backdrop ?? item.poster;
            return (
              <button key={item.id} onClick={() => onOpen(item)}
                className="relative flex-shrink-0 rounded-xl overflow-hidden group/card transition-all duration-200 hover:scale-[1.03] hover:ring-2 hover:ring-white/30"
                style={{ width: 280, height: 160 }}
              >
                {backdrop ? (
                  <img src={backdrop} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-white/5" />
                )}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />
                <div className="absolute top-2 left-2.5 right-2.5 flex items-center justify-between">
                  <span className="text-[10px] bg-black/60 border border-white/20 rounded px-2 py-0.5 text-zinc-300 uppercase tracking-wider font-medium">
                    {item.type === "tv" ? "Series" : "Movie"}
                  </span>
                  {item.vote_average && (
                    <div className="flex items-center gap-1 bg-black/60 border border-white/20 rounded px-2 py-0.5">
                      <StarIcon />
                      <span className="text-[11px] text-zinc-200 font-semibold">{item.vote_average.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <span className="text-white text-xs font-bold line-clamp-1">{item.title}</span>
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={() => scroll("right")} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 w-10 h-10 flex items-center justify-center bg-black/90 rounded-full border border-white/15 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200">
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}