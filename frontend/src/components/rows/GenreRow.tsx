import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { type SearchResult, type Genre, getGenresTmdb, discoverByGenreTmdb } from "../../api/tmdb";
import { ChevronDown, CheckIcon } from "../ui/Icons";
import { useDropdown } from "../../hooks/useDropdown";
import { CardRow } from "./CardRow";
import { MediaCard } from "../cards/MediaCard";

export function GenreRow({ onOpen }: { onOpen: (item: SearchResult) => void }) {
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [activeGenre, setActiveGenre] = useState<Genre | null>(null);
  const [items, setItems] = useState<SearchResult[]>([]);

  const { open: dropdownOpen, setOpen: setDropdownOpen, pos: dropdownPos, btnRef: genreBtnRef, wrapRef: genreWrapRef, listRef: genreListRef } = useDropdown();

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

      <div ref={genreWrapRef} className="mb-5">
        <button
          ref={genreBtnRef}
          onClick={() => setDropdownOpen(o => !o)}
          className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-semibold transition-colors"
        >
          {activeGenre?.name ?? "Select genre"}
          <span style={{ display: "inline-flex", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
            <ChevronDown size={14} />
          </span>
        </button>
        {dropdownPos && createPortal(
          <div
            ref={genreListRef}
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

      <CardRow resetKey={activeGenre?.id}>
        {items.map(item => (
          <MediaCard key={item.id} item={item} onClick={() => onOpen(item)} />
        ))}
      </CardRow>
    </section>
  );
}
