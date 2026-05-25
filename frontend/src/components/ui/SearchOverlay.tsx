import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { type SearchResult } from "../../api/tmdb";
import useDebounce from "../../hooks/useDebounce";
import { useTmdbSearch } from "../../hooks/useTmdbSearch";
import { SearchIcon, CloseIcon, PlayIcon, InfoIcon, StarIcon, ChevronDown, ClockIcon, CheckIcon } from "./Icons";
import { useRecentQueries } from "../../hooks/useRecentQueries";

const STORAGE_KEY = "xalonstream:recentQueries";
const RECENT_CLEAR_ROW_MS = 220;
const RECENT_CLEAR_STAGGER_MS = 25;

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);

  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<"multi" | "movie" | "tv">("multi");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterPos, setFilterPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [resultsVersion, setResultsVersion] = useState(0);
  const [bodyHeight, setBodyHeight] = useState<number | null>(null);
  const prevResultsRef = useRef<SearchResult[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const clearRecentTimerRef = useRef<number | null>(null);

  const dq = useDebounce(q, 350);
  const trimmed = dq.trim();

  const { results, loading } = useTmdbSearch({ query: trimmed, type: filterType, enabled: trimmed.length >= 2 });
  const { recent, commit, clear } = useRecentQueries(STORAGE_KEY);
  const [clearingRecentSnapshot, setClearingRecentSnapshot] = useState<string[] | null>(null);
  const visibleRecent = clearingRecentSnapshot ?? recent;
  const clearingRecent = clearingRecentSnapshot !== null;

  useEffect(() => {
    if (results !== prevResultsRef.current) {
      prevResultsRef.current = results;
      setResultsVersion(v => v + 1);
    }
  }, [results]);

  useEffect(() => {
    if (!q && visibleRecent.length === 0) {
      setBodyHeight(0);
      return;
    }
    requestAnimationFrame(() => {
      const el = innerRef.current;
      if (el) setBodyHeight(el.scrollHeight);
    });
  }, [results, q, visibleRecent, clearingRecent]);

  useEffect(() => {
    return () => {
      if (clearRecentTimerRef.current !== null) {
        window.clearTimeout(clearRecentTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const t = setTimeout(() => { setShow(true); inputRef.current?.focus(); }, 20);
      return () => clearTimeout(t);
    } else {
      setShow(false);
      const t = setTimeout(() => { setMounted(false); setQ(""); setExpandedId(null); }, 320);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!filterOpen) return;
    const close = () => setFilterOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [filterOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function openFilter() {
    if (filterBtnRef.current) {
      const r = filterBtnRef.current.getBoundingClientRect();
      setFilterPos({ top: r.bottom + 6, left: r.right - 170 });
    }
    setFilterOpen(o => !o);
  }

  function handlePlay(item: SearchResult) {
    commit(q.trim());
    if (item.type === "movie") {
      nav(`/play/movie/${item.id}`);
    } else {
      nav(`/play/tv/${item.id}/1/1`);
    }
    onClose();
  }

  function handleDetails(item: SearchResult) {
    commit(q.trim());
    nav(`/title/${item.type}/${item.id}`);
    onClose();
  }

  function handleClearRecent() {
    if (clearingRecent || visibleRecent.length === 0) return;

    if (clearRecentTimerRef.current !== null) {
      window.clearTimeout(clearRecentTimerRef.current);
    }

    setClearingRecentSnapshot(visibleRecent);
    clear();

    const totalDuration = RECENT_CLEAR_ROW_MS + (visibleRecent.length - 1) * RECENT_CLEAR_STAGGER_MS;
    clearRecentTimerRef.current = window.setTimeout(() => {
      setClearingRecentSnapshot(null);
      clearRecentTimerRef.current = null;
    }, totalDuration);
  }

  const filterLabel = filterType === "multi" ? "Movies & TV Shows" : filterType === "movie" ? "Movies" : "TV Shows";

  if (!mounted) return null;

  return (
    <>
      <style>{`@keyframes slideInRow { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div
        onClick={onClose}
        className="fixed inset-0 flex items-center justify-center px-4"
        style={{
          zIndex: 100,
          background: show ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0)",
          backdropFilter: show ? "blur(8px)" : "blur(0px)",
          WebkitBackdropFilter: show ? "blur(8px)" : "blur(0px)",
          transition: "background 0.3s ease, backdrop-filter 0.3s ease",
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="w-full max-w-[560px] bg-[#161616] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
          style={{
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
            transition: "opacity 0.28s ease, transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <span className="text-white font-bold text-xl">Search</span>
            <div className="flex items-center gap-2.5">
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                  ref={filterBtnRef}
                  onClick={openFilter}
                  className="flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] rounded-xl px-3 py-1.5 text-zinc-300 text-[13px] cursor-pointer transition-colors whitespace-nowrap"
                >
                  {filterLabel}
                  <span style={{ display: "inline-flex", transform: filterOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}><ChevronDown /></span>
                </button>
                {createPortal(
                  <div
                    className="fixed rounded-xl overflow-hidden border border-white/[0.12] bg-[#1e1e1e]"
                    style={{
                      top: filterPos.top, left: filterPos.left, zIndex: 99999, minWidth: 170,
                      boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
                      opacity: filterOpen ? 1 : 0,
                      transform: filterOpen ? "translateY(0) scale(1)" : "translateY(-6px) scale(0.97)",
                      pointerEvents: filterOpen ? "auto" : "none",
                      transition: "opacity 0.18s ease, transform 0.18s ease",
                    }}
                  >
                    {(["multi", "movie", "tv"] as const).map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setFilterType(opt); setFilterOpen(false); setExpandedId(null); }}
                        className={`flex items-center justify-between w-full px-4 py-2.5 text-[13px] border-none cursor-pointer text-left transition-colors
                          ${opt !== "tv" ? "border-b border-white/[0.05]" : ""}
                          ${filterType === opt ? "bg-white/[0.06] text-white" : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"}`}
                      >
                        {opt === "multi" ? "Movies & TV Shows" : opt === "movie" ? "Movies" : "TV Shows"}
                        {filterType === opt && <CheckIcon />}
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-zinc-400 hover:text-white transition-colors border-none cursor-pointer"
              >
                <CloseIcon size={14} />
              </button>
            </div>
          </div>
          <div className="px-5 pb-3">
            <div className="flex items-center gap-2.5 bg-[#0d0d0d] rounded-[14px] px-3.5 py-2.5 border border-white/10 focus-within:border-white/25 transition-colors">
              <SearchIcon size={16} />
              <input
                ref={inputRef}
                value={q}
                onChange={e => { setQ(e.target.value); setExpandedId(null); }}
                placeholder="Search a title…"
                className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder-zinc-500"
              />
              {q && (
                <button onClick={() => setQ("")} className="text-zinc-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0 flex">
                  <CloseIcon size={14} />
                </button>
              )}
            </div>
          </div>
          <div ref={bodyRef} style={{ height: bodyHeight !== null ? bodyHeight : "auto", maxHeight: "58vh", overflowY: "auto", transition: "height 400ms cubic-bezier(0.4, 0, 0.2, 1)", scrollbarWidth: "thin", scrollbarColor: "#2a2a2a transparent" }}>
          <div ref={innerRef}>
            {!q && visibleRecent.length > 0 && (
              <div
                className="px-5 border-t overflow-hidden"
                style={{
                  borderColor: clearingRecent ? "rgba(255,255,255,0)" : "rgba(255,255,255,0.06)",
                  paddingTop: clearingRecent ? 0 : 12,
                  paddingBottom: clearingRecent ? 0 : 12,
                  transition: `padding ${RECENT_CLEAR_ROW_MS}ms ease, border-color ${RECENT_CLEAR_ROW_MS}ms ease`,
                }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{
                    maxHeight: clearingRecent ? 0 : 20,
                    marginBottom: clearingRecent ? 0 : 10,
                    opacity: clearingRecent ? 0 : 1,
                    transform: clearingRecent ? "translateY(-4px)" : "translateY(0)",
                    transition: `max-height ${RECENT_CLEAR_ROW_MS}ms ease, margin-bottom ${RECENT_CLEAR_ROW_MS}ms ease, opacity ${RECENT_CLEAR_ROW_MS}ms ease, transform ${RECENT_CLEAR_ROW_MS}ms ease`,
                  }}
                >
                  <span className="text-[11px] text-zinc-500 uppercase tracking-widest">Recent</span>
                  <button
                    onClick={handleClearRecent}
                    disabled={clearingRecent}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 disabled:text-zinc-700 bg-transparent border-none cursor-pointer disabled:cursor-default transition-colors"
                  >
                    Clear
                  </button>
                </div>
                {visibleRecent.map((r, i) => {
                  const rowDelay = clearingRecent ? (visibleRecent.length - i - 1) * RECENT_CLEAR_STAGGER_MS : i * 40;
                  return (
                    <button
                      key={r}
                      onClick={() => setQ(r)}
                      className="flex items-center gap-2.5 w-full px-1 bg-transparent border-none cursor-pointer text-zinc-300 hover:text-white text-sm text-left transition-colors overflow-hidden"
                      style={{
                        maxHeight: clearingRecent ? 0 : 40,
                        opacity: show && !clearingRecent ? 1 : 0,
                        paddingTop: clearingRecent ? 0 : 8,
                        paddingBottom: clearingRecent ? 0 : 8,
                        pointerEvents: clearingRecent ? "none" : "auto",
                        transform: show && !clearingRecent ? "translateY(0)" : "translateY(-6px)",
                        transition: `max-height ${RECENT_CLEAR_ROW_MS}ms ease ${rowDelay}ms, padding ${RECENT_CLEAR_ROW_MS}ms ease ${rowDelay}ms, opacity ${RECENT_CLEAR_ROW_MS}ms ease ${rowDelay}ms, transform ${RECENT_CLEAR_ROW_MS}ms ease ${rowDelay}ms`,
                      }}
                    >
                      <ClockIcon />
                      {r}
                    </button>
                  );
                })}
              </div>
            )}

            {!loading && trimmed.length >= 2 && results.length === 0 && (
              <div className="py-10 text-center text-sm text-zinc-500">No results found.</div>
            )}
            <div key={resultsVersion}>
              {results.map((item, i) => {
                const key = `${item.type}:${item.id}`;
                const isExpanded = expandedId === key;
                const hasRating = typeof item.vote_average === "number" && item.vote_average >= 1;
                return (
                  <div
                    key={key}
                    className={`border-t border-white/[0.05] transition-colors ${isExpanded ? "bg-white/[0.04]" : ""}`}
                    style={{ animation: "slideInRow 0.22s ease both", animationDelay: `${i * 35}ms` }}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : key)}
                      className="flex items-center gap-3.5 w-full px-5 py-3 bg-transparent border-none cursor-pointer text-left hover:bg-white/[0.03] transition-colors"
                    >
                      <img
                        src={item.poster ?? undefined}
                        alt={item.title}
                        className="w-10 h-14 rounded-lg object-cover bg-white/10 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">{item.title}</div>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5 text-[11px] text-zinc-400">
                          <span>{item.type === "tv" ? "TV Show" : "Movie"}</span>
                          {item.year && <><span className="text-zinc-600">|</span><span>{item.year}</span></>}
                          {hasRating && (
                            <><span className="text-zinc-600">|</span>
                            <span className="flex items-center gap-1">
                              <StarIcon />
                              {item.vote_average!.toFixed(1)}
                            </span></>
                          )}
                        </div>
                      </div>
                      <span
                        className="text-zinc-600 flex-shrink-0 transition-transform duration-200"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                      >
<ChevronDown size={14} />
                      </span>
                    </button>
                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{ maxHeight: isExpanded ? 200 : 0, opacity: isExpanded ? 1 : 0 }}
                    >
                      <div className="px-5 pb-4">
                        {item.overview && (
                          <p className="text-xs text-zinc-400 leading-relaxed mb-3 line-clamp-3">{item.overview}</p>
                        )}
                        <div className="flex gap-2.5">
                          <button
                            onClick={() => handlePlay(item)}
                            className="flex items-center gap-1.5 bg-white text-black font-bold text-xs rounded-[10px] px-4 py-1.5 cursor-pointer border-none hover:bg-zinc-100 transition-colors"
                          >
                            <PlayIcon size={11} />
                            Play
                          </button>
                          <button
                            onClick={() => handleDetails(item)}
                            className="flex items-center gap-1.5 bg-white/10 text-white font-semibold text-xs rounded-[10px] px-4 py-1.5 cursor-pointer border border-white/10 hover:bg-white/20 transition-colors"
                          >
                            <InfoIcon />
                            See more
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}
