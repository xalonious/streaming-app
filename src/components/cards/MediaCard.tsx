import { type SearchResult } from "../../api/tmdb";
import { StarIcon } from "../ui/Icons";

export type MediaCardVariant = "poster" | "backdrop";

export function MediaCard({ item, onClick, rank, variant = "poster", imageLoading = "lazy" }: {
  item: SearchResult;
  onClick: () => void;
  rank?: number;
  variant?: MediaCardVariant;
  imageLoading?: "eager" | "lazy";
}) {
  const isBackdrop = variant === "backdrop";
  const imageSrc = isBackdrop ? item.backdrop ?? item.poster : item.poster;
  const rankLabel = rank?.toString().padStart(2, "0");

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 group/card text-left ${isBackdrop ? "w-[260px] sm:w-[320px]" : "w-[200px]"}`}
    >
      <div className="relative rounded-xl overflow-hidden ring-1 ring-white/10 group-hover/card:ring-white/30 transition-all duration-200 group-hover/card:scale-[1.02]">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={item.title}
            className={`w-full ${isBackdrop ? "aspect-video" : "aspect-[2/3]"} object-cover`}
            loading={imageLoading}
            decoding="async"
          />
        ) : (
          <div className={`w-full ${isBackdrop ? "aspect-video" : "aspect-[2/3]"} bg-white/5 flex items-center justify-center text-xs text-zinc-500 p-2 text-center`}>
            {item.title}
          </div>
        )}
        {rank !== undefined && (
          <div
            className="absolute left-0 top-0 flex h-11 w-8 flex-col items-center justify-start bg-[#e50914] pt-1 text-white shadow-[0_6px_14px_rgba(0,0,0,0.35)]"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 84%, 0 100%)" }}
            aria-label={`Top ${rank}`}
          >
            <span className="text-[8px] font-black leading-none tracking-wide">TOP</span>
            <span className="text-[10px] font-black leading-tight">{rankLabel}</span>
          </div>
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
  );
}
