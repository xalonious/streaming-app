import { useEffect, useState } from "react";
import { type SearchResult, getTitleImages } from "../api/tmdb";
import { StarIcon, PlayIcon, InfoIcon } from "./Icons";

export function HeroSection({ items, onPlay, onDetails }: {
  items: SearchResult[];
  onPlay: (item: SearchResult) => void;
  onDetails: (item: SearchResult) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const [logos, setLogos] = useState<Record<string, string | null>>({});

  const top10 = items.slice(0, 10);

  function cacheKey(item: SearchResult) {
    return `${item.type}:${item.id}`;
  }

  function prefetch(item: SearchResult) {
    const key = cacheKey(item);
    setLogos(prev => {
      if (key in prev) return prev;
      getTitleImages(item.type, item.id)
        .then(d => setLogos(p => ({ ...p, [key]: d.logoUrl })))
        .catch(() => setLogos(p => ({ ...p, [key]: null })));
      return { ...prev, [key]: null };
    });
  }

  useEffect(() => {
    if (!top10.length) return;
    prefetch(top10[activeIdx]);
    const next = top10[(activeIdx + 1) % top10.length];
    if (next) prefetch(next);
  }, [activeIdx, top10.length]);

  function goTo(idx: number) {
    if (animating || idx === activeIdx) return;
    setPrevIdx(activeIdx);
    setAnimating(true);
    setActiveIdx(idx);
    setTimeout(() => { setPrevIdx(null); setAnimating(false); }, 700);
  }

  useEffect(() => {
    if (top10.length < 2) return;
    const t = setInterval(() => {
      setActiveIdx(prev => {
        const next = (prev + 1) % top10.length;
        setPrevIdx(prev);
        setAnimating(true);
        setTimeout(() => { setPrevIdx(null); setAnimating(false); }, 700);
        return next;
      });
    }, 10000);
    return () => clearInterval(t);
  }, [top10.length]);

  const active = top10[activeIdx];
  const prev = prevIdx !== null ? top10[prevIdx] : null;

  if (!active) return null;

  const logoUrl = logos[cacheKey(active)] ?? null;

  return (
    <>
      <style>{`
        @keyframes heroSlideIn {
          from { opacity: 0; transform: scale(1.04); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes heroSlideOut {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.97); }
        }
        @keyframes heroTextIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <section className="relative w-full overflow-hidden" style={{ height: "91vh", minHeight: 500 }}>

        {prev && (
          <div key={`out-${prevIdx}`} className="absolute inset-0" style={{ animation: "heroSlideOut 0.7s ease forwards", zIndex: 1 }}>
            <img src={prev.backdrop ?? prev.poster ?? undefined} alt="" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.05) 100%)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.85) 18%, transparent 55%)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 20%)" }} />
          </div>
        )}

        <div key={`in-${activeIdx}`} className="absolute inset-0" style={{ animation: "heroSlideIn 0.7s ease forwards", zIndex: 2 }}>
          <img src={active.backdrop ?? active.poster ?? undefined} alt="" className="w-full h-full object-cover object-center" loading="eager" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.05) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.85) 18%, transparent 55%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 20%)" }} />
        </div>

        <div
          key={`text-${activeIdx}`}
          className="absolute bottom-0 left-0 z-10 px-10 sm:px-16 pb-14 max-w-2xl"
          style={{ animation: "heroTextIn 0.6s ease 0.2s both", zIndex: 10 }}
        >
          <div className="flex items-center flex-wrap gap-2 mb-3 text-xs text-zinc-300">
            {typeof active.vote_average === "number" && active.vote_average >= 1 && (
              <span className="flex items-center gap-1">
                <StarIcon />
                <span className="text-yellow-400 font-semibold">{active.vote_average.toFixed(1)}</span>
              </span>
            )}
            {active.year && <>{typeof active.vote_average === "number" && active.vote_average >= 1 && <span className="text-zinc-600">|</span>}<span>{active.year}</span></>}
          </div>
          {logoUrl ? (
            <img src={logoUrl} alt={active.title} className="h-20 sm:h-28 w-auto object-contain mb-3 drop-shadow-2xl" style={{ maxWidth: "380px" }} />
          ) : (
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-3 tracking-tight">{active.title}</h1>
          )}
          {active.overview && (
            <p className="text-sm text-zinc-300/85 leading-relaxed mb-6 line-clamp-3 max-w-lg">{active.overview}</p>
          )}
          <div className="flex items-center gap-3">
            <button onClick={() => onPlay(active)} className="flex items-center gap-2 bg-white text-black font-bold text-sm rounded-xl px-7 py-2.5 hover:bg-zinc-100 transition-all active:scale-95">
              <PlayIcon size={15} /> Play
            </button>
            <button onClick={() => onDetails(active)} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm rounded-xl px-5 py-2.5 hover:bg-white/20 transition-all">
              <InfoIcon /> See More
            </button>
          </div>
        </div>

        <div className="absolute bottom-6 right-10 z-10 flex items-center gap-1.5">
          {top10.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-300 border-none cursor-pointer"
              style={{
                width: i === activeIdx ? 20 : 6,
                height: 6,
                background: i === activeIdx ? "white" : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>
      </section>
    </>
  );
}