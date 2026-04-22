import { type SearchResult } from "../api/tmdb";
import { CardRow } from "./CardRow";
import { MediaCard } from "./MediaCard";

export function TopRatedRow({ items, onOpen, type, onTypeChange }: {
  items: SearchResult[];
  onOpen: (item: SearchResult) => void;
  type: "movie" | "tv";
  onTypeChange: (t: "movie" | "tv") => void;
}) {
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
      <CardRow resetKey={type}>
        {items.map(item => (
          <MediaCard key={item.id} item={item} onClick={() => onOpen(item)} />
        ))}
      </CardRow>
    </section>
  );
}
