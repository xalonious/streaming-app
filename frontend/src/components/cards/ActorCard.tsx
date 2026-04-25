import { Link } from "react-router-dom";

const PROFILE_BASE = "https://image.tmdb.org/t/p/w185";

type Actor = {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
};

export function ActorCard({ actor }: { actor: Actor }) {
  const img = actor.profile_path ? `${PROFILE_BASE}${actor.profile_path}` : null;

  return (
    <Link
      to={`/actor/${actor.id}`}
      className="flex items-center gap-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-2xl px-5 py-4 transition-colors"
    >
      <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 ring-1 ring-white/10">
        {img ? (
          <img src={img} alt={actor.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-zinc-500">?</div>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-white truncate">{actor.name}</div>
        {actor.character && (
          <div className="text-xs text-zinc-500 truncate mt-0.5">{actor.character}</div>
        )}
      </div>
    </Link>
  );
}