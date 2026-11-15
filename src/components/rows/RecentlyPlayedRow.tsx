import type { SearchResult } from "../../api/tmdb";
import { useRecentlyPlayed } from "../../hooks/useRecentlyPlayed";
import { refreshRecentlyPlayed } from "../../lib/recentlyPlayed";
import { PosterCarousel } from "./PosterCarousel";

export function RecentlyPlayedRow({ onOpen }: { onOpen: (item: SearchResult) => void }) {
  const { items, error } = useRecentlyPlayed();
  const feedback = error && <p role="alert" className="mb-4 text-sm text-red-300">{error} <button onClick={() => void refreshRecentlyPlayed()} className="underline hover:text-white">Retry</button></p>;
  if (!items.length) return feedback ? <div className="px-4 sm:px-6 py-6">{feedback}</div> : null;

  return (
    <PosterCarousel title="Recently played" items={items} onOpen={onOpen} positionKey="home:recently-played" cardVariant="backdrop" scrollItems={4}>
      {feedback}
    </PosterCarousel>
  );
}
