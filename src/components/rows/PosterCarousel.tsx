import { type ReactNode, useEffect, useState } from "react";
import { type SearchResult } from "../../api/tmdb";
import { CardRow } from "./CardRow";
import { MediaCard, type MediaCardVariant } from "../cards/MediaCard";

export function PosterCarousel({
  title,
  items,
  onOpen,
  badge,
  rightContent,
  children,
  resetKey,
  scrollAmount,
  scrollItems,
  cardVariant = "poster",
  sectionClassName = "px-4 sm:px-6 py-6",
  loading = false,
}: {
  title: ReactNode;
  items: SearchResult[];
  onOpen: (item: SearchResult) => void;
  badge?: boolean;
  rightContent?: ReactNode;
  children?: ReactNode;
  resetKey?: unknown;
  scrollAmount?: number;
  scrollItems?: number;
  cardVariant?: MediaCardVariant;
  sectionClassName?: string;
  loading?: boolean;
}) {
  const preloadPageSize = cardVariant === "backdrop" ? scrollItems ?? 4 : 0;
  const initialEagerImageCount = preloadPageSize * 2;
  const [eagerImageCount, setEagerImageCount] = useState(initialEagerImageCount);

  useEffect(() => {
    setEagerImageCount(initialEagerImageCount);
  }, [initialEagerImageCount, resetKey, items.length]);

  if (!items.length && !loading) return null;

  const preloadMoreImages = () => {
    if (!preloadPageSize) return;
    setEagerImageCount(count => Math.min(items.length, count + preloadPageSize));
  };

  return (
    <section className={sectionClassName} aria-busy={loading}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 rounded-full bg-[#e50914]" />
          <h2 className="text-white font-bold text-base sm:text-lg">{title}</h2>
        </div>
        {rightContent}
      </div>
      {children}
      {loading && !items.length ? (
        <div role="status" aria-label="Loading titles" className="flex gap-4 overflow-hidden animate-pulse">
          {Array.from({ length: scrollItems ?? 4 }, (_, index) => (
            <div key={index} aria-hidden="true" className={`flex-shrink-0 ${cardVariant === "backdrop" ? "w-[260px] sm:w-[320px]" : "w-[200px]"}`}>
              <div className={`rounded-xl bg-white/5 ${cardVariant === "backdrop" ? "aspect-video" : "aspect-[2/3]"}`} />
              <div className="mt-3 h-4 w-2/3 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : (
        <CardRow
          resetKey={resetKey}
          scrollAmount={scrollAmount}
          scrollItems={scrollItems}
          onScrollIntent={preloadMoreImages}
        >
          {items.map((item, idx) => (
            <MediaCard
              key={item.id}
              item={item}
              onClick={() => onOpen(item)}
              rank={badge ? idx + 1 : undefined}
              variant={cardVariant}
              imageLoading={idx < eagerImageCount ? "eager" : "lazy"}
            />
          ))}
        </CardRow>
      )}
    </section>
  );
}
