
import { Poster } from "./Poster";

export type FeaturedHeroItem = {
  id: number | string;
  type: "movie" | "tv";
  title: string;
  overview?: string | null;
  year?: string | number | null;
  poster: string | null;
  backdrop?: string | null; 
};

export function FeaturedHero({
  item,
  onPlay,
  onDetails,
  onSeeMore,
}: {
  item: FeaturedHeroItem;
  onPlay: () => void;
  onDetails: () => void;
  onSeeMore: () => void;
}) {
  const backdrop = item.backdrop ?? item.poster;

  return (
    <section className="mb-10">
      <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/[0.10] bg-white/[0.03]">
        {backdrop ? (
          <div className="absolute inset-0">
            <img
              src={backdrop}
              alt=""
              className="h-full w-full object-cover opacity-70 blur-[1px] scale-[1.03]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        )}

        <div className="relative grid gap-6 p-6 sm:p-10 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3 py-1 text-[11px] text-zinc-200 ring-1 ring-white/[0.10]">
              <span className="font-semibold tracking-wide">FEATURED</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-300">
                Trending {item.type === "tv" ? "TV" : "Movie"}
              </span>
              {item.year ? (
                <>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-300">{item.year}</span>
                </>
              ) : null}
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              {item.title}
            </h2>

            <p className="mt-3 line-clamp-3 max-w-prose text-sm leading-relaxed text-zinc-300/90">
              {item.overview || "—"}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={onPlay}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-100"
              >
                <span className="text-[12px]">▶</span>
                Play
              </button>

              <button
                onClick={onDetails}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-zinc-100 ring-1 ring-white/15 hover:bg-white/15"
              >
                Details
              </button>

              <button
                onClick={onSeeMore}
                className="inline-flex items-center gap-2 rounded-xl bg-white/0 px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100"
              >
                See more <span className="opacity-80">↓</span>
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="ml-auto w-[240px]">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-b from-white/10 to-transparent blur-2xl opacity-70" />
                <div className="relative rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.12] p-2">
                  <Poster src={item.poster} title={item.title} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </section>
  );
}
