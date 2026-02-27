type Actor = {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
};

const PROFILE_BASE = "https://image.tmdb.org/t/p/w185";

export function ActorCard({ actor }: { actor: Actor }) {
  const img = actor.profile_path ? `${PROFILE_BASE}${actor.profile_path}` : null;

  return (
    <div className="w-full">
      <div className="aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-black/30">
        {img ? (
          <img
            src={img}
            alt={actor.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-white/40">
            No photo
          </div>
        )}
      </div>

      <div className="mt-2">
        <div className="line-clamp-1 text-sm font-semibold text-white">
          {actor.name}
        </div>
        {actor.character ? (
          <div className="line-clamp-1 text-xs text-white/60">
            {actor.character}
          </div>
        ) : null}
      </div>
    </div>
  );
}