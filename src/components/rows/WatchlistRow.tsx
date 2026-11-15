import type { SearchResult } from "../../api/tmdb";
import { useWatchlist } from "../../hooks/useWatchlist";
import { refreshWatchlist } from "../../lib/watchlist";
import { PosterCarousel } from "./PosterCarousel";

export function WatchlistRow({ onOpen }: { onOpen: (item: SearchResult) => void }) {
  const { items, error } = useWatchlist();
  const feedback = error && <p role="alert" className="mb-4 text-sm text-red-300">{error} <button onClick={() => void refreshWatchlist()} className="underline hover:text-white">Retry</button></p>;

  if (!items.length) return feedback ? <div className="px-4 sm:px-6 py-6">{feedback}</div> : null;

  return (
    <PosterCarousel
      title="My watchlist"
      items={items}
      onOpen={onOpen}
      positionKey="home:watchlist"
      cardVariant="backdrop"
      scrollItems={4}
    >
      {feedback}
    </PosterCarousel>
  );
}
