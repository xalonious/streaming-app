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

      const id = params.id ? Number(params.id) : NaN;
      const season = params.season ? Number(params.season) : NaN;
      const episode = params.episode ? Number(params.episode) : NaN;

      try {
        if (Number.isFinite(id) && Number.isFinite(season) && Number.isFinite(episode)) {
          const r = await getTvStream(id, season, episode);
          if (!cancelled) setUrl(r.url);
          return;
        }

        if (Number.isFinite(id)) {
          const r = await getMovieStream(id);
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
  }, [params.id, params.season, params.episode]);

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
