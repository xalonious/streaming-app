import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type SearchResult, type Genre, getGenresTmdb, discoverByGenreTmdb } from "../api/tmdb";
import { ChevronLeft, ChevronRight, StarIcon, ChevronDown, CheckIcon } from "./Icons";

export function GenreRow({ onOpen }: { onOpen: (item: SearchResult) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const genreBtnRef = useRef<HTMLButtonElement>(null);
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [activeGenre, setActiveGenre] = useState<Genre | null>(null);
  const [items, setItems] = useState<SearchResult[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    getGenresTmdb(mediaType)
      .then(d => {
        setGenres(d.genres);
        const match = activeGenre
          ? d.genres.find(g =>
              g.name.toLowerCase().includes(activeGenre.name.toLowerCase().split(" ")[0]) ||
              activeGenre.name.toLowerCase().includes(g.name.toLowerCase().split(" ")[0])
            )
          : null;
        setActiveGenre(match ?? d.genres[0] ?? null);
      })
      .catch(() => {});
  }, [mediaType]);

  useEffect(() => {
    if (!activeGenre) return;
    discoverByGenreTmdb(mediaType, activeGenre.id)
      .then(d => setItems(d.results ?? []))
      .catch(() => {});
  }, [activeGenre]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, [items]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const close = () => setDropdownOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [dropdownOpen]);

  function openDropdown() {
    if (genreBtnRef.current) {
      const r = genreBtnRef.current.getBoundingClientRect();
      setDropdownPos({ top: r.bottom + 6, left: r.left });
    }
    setDropdownOpen(o => !o);
  }

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -640 : 640, behavior: "smooth" });
  };

  return (
    <section className="px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 rounded-full bg-[#e50914]" />
          <h2 className="text-white font-bold text-base sm:text-lg">Browse by genre</h2>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white/[0.06] rounded-xl border border-white/10">
          <button
            onClick={() => setMediaType("movie")}
            className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition ${mediaType === "movie" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
          >Movies</button>
          <button
            onClick={() => setMediaType("tv")}
            className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition ${mediaType === "tv" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
          >Series</button>
        </div>
      </div>

      <div className="mb-5" onClick={e => e.stopPropagation()}>
        <button
          ref={genreBtnRef}
          onClick={openDropdown}
          className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-semibold transition-colors"
        >
          {activeGenre?.name ?? "Select genre"}
          <span style={{ display: "inline-flex", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
            <ChevronDown size={14} />
          </span>
        </button>
        {createPortal(
          <div
            className="fixed rounded-xl overflow-hidden border border-white/[0.12] bg-[#1e1e1e]"
            style={{
              top: dropdownPos.top, left: dropdownPos.left,
              zIndex: 99999, minWidth: 200, maxHeight: 320, overflowY: "auto",
              boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
              opacity: dropdownOpen ? 1 : 0,
              transform: dropdownOpen ? "translateY(0) scale(1)" : "translateY(-6px) scale(0.97)",
              pointerEvents: dropdownOpen ? "auto" : "none",
              transition: "opacity 0.18s ease, transform 0.18s ease",
              scrollbarWidth: "thin",
              scrollbarColor: "#333 transparent",
            }}
          >
            {genres.map(g => (
              <button
                key={g.id}
                onClick={() => { setActiveGenre(g); setDropdownOpen(false); }}
                className={`flex items-center justify-between w-full px-4 py-2.5 text-sm border-none cursor-pointer text-left transition-colors border-b border-white/[0.05] last:border-0 ${
                  activeGenre?.id === g.id ? "bg-white/[0.08] text-white" : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {g.name}
                {activeGenre?.id === g.id && <CheckIcon />}
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>

      <div className="relative group/carousel">
        <button onClick={() => scroll("left")} className="absolute left-0 top-[38%] -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 flex items-center justify-center bg-black/90 rounded-full border border-white/15 text-white opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200">
          <ChevronLeft />
        </button>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {items.map(item => (
            <button key={item.id} onClick={() => onOpen(item)} className="flex-shrink-0 group/card text-left" style={{ width: 200 }}>
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