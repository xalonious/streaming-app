import { Link } from "react-router-dom";
import { type SearchResult } from "../../api/tmdb";
import { StarIcon } from "../ui/Icons";

export function RecommendationsGrid({ items }: { items: SearchResult[] }) {
  if (!items.length) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-5 rounded-full bg-[#e50914]" />
        <h2 className="text-white font-bold text-base sm:text-lg">You may like</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
        {items.slice(0, 18).map(item => (
          <Link key={item.id} to={`/title/${item.type}/${item.id}`} className="group block">
            <div className="relative rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-white/30 transition-all duration-200 group-hover:scale-[1.02]">
              {item.backdrop ?? item.poster ? (
                <img
                  src={(item.backdrop ?? item.poster)!}
                  alt={item.title}
                  className="w-full aspect-video object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-video bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">{item.title}</div>
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
          </Link>
        ))}
      </div>
    </section>
  );
}
