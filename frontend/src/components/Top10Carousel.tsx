import { useRef, useState } from "react";
import { type SearchResult } from "../api/tmdb";
import { ChevronLeft, ChevronRight } from "./Icons";

function NumberedPosterCard({ item, idx, onOpen }: {
  item: SearchResult;
  idx: number;
  onOpen: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex-shrink-0 flex items-end"
      style={{ width: 240 }}
    >
      <div className="flex-shrink-0 flex items-end justify-center pb-2" style={{ width: 60 }}>
        <span
          style={{
            fontSize: "6rem",
            lineHeight: 1,
            fontWeight: 900,
            userSelect: "none",
            color: hovered ? "#e50914" : "transparent",
            WebkitTextStroke: hovered ? "0px" : "2.5px #e50914",
            transform: hovered ? "translateX(-4px)" : "translateX(0)",
            transition: "color 0.2s, transform 0.2s",
          }}
        >
          {idx + 1}
        </span>
      </div>

      <div
        className="rounded-xl overflow-hidden transition-all duration-200"
        style={{
          width: 180,
          outline: hovered ? "2px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {item.poster ? (
          <img src={item.poster} alt={item.title} className="w-full aspect-[2/3] object-cover" loading="lazy" />
        ) : (
          <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-[10px] text-zinc-500 p-2 text-center">{item.title}</div>
        )}
      </div>
    </button>
  );
}

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
      <div className="flex items-end gap-4 mb-7">
        <span className="font-black uppercase leading-none select-none" style={{
          fontSize: "clamp(3.5rem,9vw,6rem)",
          color: "transparent",
          WebkitTextStroke: "2px #e50914",
          letterSpacing: "-0.02em",
        }}>TOP 10</span>
        <div className="flex flex-col mb-2 text-zinc-200 font-bold tracking-[0.2em] text-xs sm:text-sm leading-snug">
          <span>CONTENT</span><span>TODAY</span>
        </div>
      </div>

      <div className="relative group/carousel">
        <button onClick={() => scroll("left")} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 flex items-center justify-center bg-black/90 rounded-full border border-white/15 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200">
          <ChevronLeft />
        </button>

        <div ref={scrollRef} className="flex overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {top10.map((item, idx) => (
            <NumberedPosterCard key={item.id} item={item} idx={idx} onOpen={() => onOpen(item)} />
          ))}
        </div>

        <button onClick={() => scroll("right")} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 w-10 h-10 flex items-center justify-center bg-black/90 rounded-full border border-white/15 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200">
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}