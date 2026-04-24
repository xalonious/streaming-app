import { type SearchResult } from "../../api/tmdb";
import { StarIcon } from "../ui/Icons";

export function MediaCard({ item, onClick, rank }: {
  item: SearchResult;
  onClick: () => void;
  rank?: number;
}) {
  return (
    <button onClick={onClick} className="flex-shrink-0 group/card text-left" style={{ width: 200 }}>
      <div className="relative rounded-xl overflow-hidden ring-1 ring-white/10 group-hover/card:ring-white/30 transition-all duration-200 group-hover/card:scale-[1.02]">
        {item.poster ? (
          <img src={item.poster} alt={item.title} className="w-full aspect-[2/3] object-cover" loading="lazy" />
        ) : (
          <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-xs text-zinc-500 p-2 text-center">{item.title}</div>
        )}
        {rank !== undefined && (
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 border border-white/20 flex items-center justify-center">
            <span className="text-white text-xs font-black">{rank}</span>
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
