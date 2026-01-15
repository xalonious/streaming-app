import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMovieStream, getTvStream } from "../api/stream";

export default function PlayerPage() {
  const nav = useNavigate();
  const params = useParams();

  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setUrl(null);
      setError(null);

      try {
        if (params.type === "movie" && params.id) {
          const r = await getMovieStream(Number(params.id));
          if (!cancelled) setUrl(r.url);
          return;
        }

        if (params.id && params.season && params.episode) {
          const r = await getTvStream(
            Number(params.id),
            Number(params.season),
            Number(params.episode)
          );
          if (!cancelled) setUrl(r.url);
          return;
        }

        throw new Error("Invalid route params");
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load player");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [params.id, params.type, params.season, params.episode]);

  return (
    <div className="fixed inset-0 bg-black">
      <button
        onClick={() => nav(-1)}
        className="absolute left-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm text-white backdrop-blur hover:bg-black/55"
      >
        <span className="text-lg leading-none">←</span>
        Back
      </button>

      {error ? (
        <div className="flex h-full items-center justify-center p-6 text-sm text-red-300">
          {error}
        </div>
      ) : url ? (
        <iframe
          src={url}
          className="h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-zinc-300">
          Loading player…
        </div>
      )}
    </div>
  );
}
