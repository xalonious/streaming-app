import { type SearchResult } from "../../api/tmdb";
import { CardRow } from "./CardRow";
import { MediaCard } from "../cards/MediaCard";

export function Top10Carousel({ items, onOpen }: {
  items: SearchResult[];
  onOpen: (item: SearchResult) => void;
}) {
  const top10 = items.slice(0, 10);

  return (
    <section className="px-4 sm:px-6 pt-4 pb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-5 rounded-full bg-[#e50914]" />
        <h2 className="text-white font-bold text-base sm:text-lg">TOP 10 Today</h2>
      </div>
      <CardRow scrollAmount={500}>
        {top10.map((item, idx) => (
          <MediaCard key={item.id} item={item} onClick={() => onOpen(item)} rank={idx + 1} />
        ))}
      </CardRow>
    </section>
  );
}
