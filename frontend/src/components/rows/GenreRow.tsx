import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { type SearchResult, type Genre, getGenresTmdb, discoverByGenreTmdb } from "../../api/tmdb";
import { ChevronDown, CheckIcon } from "../ui/Icons";
import { useDropdown } from "../../hooks/useDropdown";
import { MediaTypeToggle } from "../ui/MediaTypeToggle";
import { PosterCarousel } from "./PosterCarousel";

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
        setActiveGenre(prev => {
          const match = prev
            ? d.genres.find(g =>
                g.name.toLowerCase().includes(prev.name.toLowerCase().split(" ")[0]) ||
                prev.name.toLowerCase().includes(g.name.toLowerCase().split(" ")[0])
              )
            : null;
          return match ?? d.genres[0] ?? null;
        });
      })
      .catch(() => {});
  }, [mediaType]);

  useEffect(() => {
    if (!activeGenre) return;
    let cancelled = false;
    discoverByGenreTmdb(mediaType, activeGenre.id)
      .then(d => { if (!cancelled) setItems(d.results ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activeGenre, mediaType]);

  return (
    <PosterCarousel
      title="Browse by genre"
      items={items}
      onOpen={onOpen}
      resetKey={activeGenre?.id}
      rightContent={
        <MediaTypeToggle
          value={mediaType}
          options={[{ label: "Movies", value: "movie" }, { label: "Series", value: "tv" }]}
          onChange={(v) => setMediaType(v)}
        />
      }
    >
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
    </PosterCarousel>
  );
}
