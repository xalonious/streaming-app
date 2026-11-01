"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "../ui/Icons";
import { PlayerSourcePicker } from "../ui/PlayerSourcePicker";
import { useTitleDetails } from "../../hooks/useTitleDetails";
import { useProviderPlayback } from "../../hooks/useProviderPlayback";
import { playerReturnTo } from "../../lib/playerNavigation";

export default function PlayerPage() {
  const router = useRouter();
  const params = useParams<Record<string, string>>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const id = params.id ? Number(params.id) : NaN;
  const season = params.season ? Number(params.season) : NaN;
  const episode = params.episode ? Number(params.episode) : NaN;
  const playbackType = useMemo(() => {
    if (Number.isFinite(season) && Number.isFinite(episode)) return "tv";
    if (params.type === "tv" || params.type === "movie") return params.type;
    return "movie";
  }, [params.type, season, episode]);
  const playback = useProviderPlayback(playbackType, id, season, episode);
  useEffect(() => {
    const check = () => setIsFullscreen(!!document.fullscreenElement || window.innerHeight === screen.height);
    window.addEventListener("resize", check);
    document.addEventListener("fullscreenchange", check);
    return () => { window.removeEventListener("resize", check); document.removeEventListener("fullscreenchange", check); };
  }, []);
  const { title } = useTitleDetails(Number.isFinite(id) ? id : NaN, playbackType);
  useEffect(() => {
    if (!title) { document.title = "Loading..."; return; }
    if (playbackType === "tv" && Number.isFinite(season) && Number.isFinite(episode)) {
      document.title = `${title} • S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
    } else document.title = title;
    return () => { document.title = "Streaming"; };
  }, [title, playbackType, season, episode]);
  return (
    <div className="fixed inset-0 bg-black">
      <button onClick={() => {
        const returnTo = new URLSearchParams(window.location.search).get("returnTo");
        router.replace(playerReturnTo(returnTo, playbackType, id), { scroll: false });
      }} aria-label="Back"
        className={`absolute top-5 left-6 z-50 w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/15 rounded-full text-white transition-all ${isFullscreen ? "opacity-0 pointer-events-none" : ""}`}><ChevronLeft /></button>
      {!isFullscreen && <PlayerSourcePicker providers={playback.providers} selectedId={playback.selected?.id ?? null} loading={playback.loading} onSelect={playback.select} />}
      {playback.loading ? <div role="status" className="flex h-full items-center justify-center text-sm text-zinc-300">Loading player…</div> : playback.error ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-sm text-red-300"><p role="alert">{playback.error}</p><button onClick={() => void playback.refresh()} className="rounded-lg bg-white/10 px-4 py-2 text-white">Retry sources</button></div>
      ) : playback.url ? <iframe key={playback.url} title={`${title ?? playbackType} player`} src={playback.url} className="h-full w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /> : (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-sm text-zinc-300"><p>No enabled providers support {playbackType === "movie" ? "movies" : "TV episodes"}. Manage sources from the homepage settings.</p><Link href="/" className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-500">Back to home</Link></div>
      )}
    </div>
  );
}
