import { type ReactNode } from "react";
import { type SearchResult } from "../../api/tmdb";
import { CardRow } from "./CardRow";
import { MediaCard } from "../cards/MediaCard";

export function PosterCarousel({
  title,
  items,
  onOpen,
  badge,
  rightContent,
  children,
  resetKey,
  scrollAmount,
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
  sectionClassName?: string;
}) {
  if (!items.length) return null;

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
      <CardRow resetKey={resetKey} scrollAmount={scrollAmount}>
        {items.map((item, idx) => (
          <MediaCard key={item.id} item={item} onClick={() => onOpen(item)} rank={badge ? idx + 1 : undefined} />
        ))}
      </CardRow>
    </section>
  );
}
