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
}) {
  const preloadPageSize = cardVariant === "backdrop" ? scrollItems ?? 4 : 0;
  const initialEagerImageCount = preloadPageSize * 2;
  const [eagerImageCount, setEagerImageCount] = useState(initialEagerImageCount);

  useEffect(() => {
    setEagerImageCount(initialEagerImageCount);
  }, [initialEagerImageCount, resetKey, items.length]);

  if (!items.length) return null;

  const preloadMoreImages = () => {
    if (!preloadPageSize) return;
    setEagerImageCount(count => Math.min(items.length, count + preloadPageSize));
  };

  return (
    <section className={sectionClassName}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 rounded-full bg-[#e50914]" />
          <h2 className="text-white font-bold text-base sm:text-lg">{title}</h2>
        </div>
        {rightContent}
      </div>
      {children}
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
    </section>
  );
}
