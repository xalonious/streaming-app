import { Poster } from "./Poster";

export type ResultCardItem = {
  id: number | string;
  type: "movie" | "tv";
  title: string;
  year?: string | number | null;
  poster: string | null;
};

export function ResultCard({
  item,
  onOpen,
}: {
  item: ResultCardItem;
  onOpen: () => void;
}) {
  return (
    <button className="group text-left" onClick={onOpen}>
      <div
        className={[
          "relative rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.07] p-2",
          "transition will-change-transform",
          "hover:-translate-y-0.5 hover:bg-white/[0.05] hover:ring-white/[0.12]",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute -inset-0.5 rounded-[18px] opacity-0 blur-md transition group-hover:opacity-100 bg-gradient-to-b from-white/10 to-transparent" />

        <div className="relative overflow-hidden rounded-xl">
          <Poster src={item.poster} title={item.title} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition group-hover:opacity-100" />
        </div>

        <div className="relative mt-3 space-y-1 px-1 pb-2">
          <div className="line-clamp-1 text-sm font-semibold tracking-tight">{item.title}</div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="rounded-full bg-white/10 px-2 py-0.5 ring-1 ring-white/10">
              {item.type === "tv" ? "TV" : "Movie"}
            </span>
            {item.year ? <span>{item.year}</span> : null}
          </div>
        </div>
      </div>
    </button>
  );
}
