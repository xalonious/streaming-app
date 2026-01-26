import { useEffect, useMemo, useRef, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import { searchTmdb, trendingTmdb, type SearchResult } from "../api/tmdb";
import { useNavigate } from "react-router-dom";
import { Pill } from "../components/Pill";
import { SkeletonCard } from "../components/SkeletonCard";
import { ResultCard } from "../components/ResultCard";
import { FeaturedHero } from "../components/FeaturedHero";

type SearchType = "multi" | "movie" | "tv";
type TrendingWindow = "day" | "week";

const RECENT_KEY = "xalonstream:recentQueries";
function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function saveRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
  } catch {}
}

export default function HomePage() {
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const trendGridRef = useRef<HTMLDivElement | null>(null);

  const [q, setQ] = useState("");
  const dq = useDebounce(q, 400);

  const [type, setType] = useState<SearchType>("multi");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [trendWindow, setTrendWindow] = useState<TrendingWindow>("day");
  const [trendLoading, setTrendLoading] = useState(false);
  const [trending, setTrending] = useState<SearchResult[]>([]);
  const [trendError, setTrendError] = useState<string | null>(null);

  const [recent, setRecent] = useState<string[]>(() => loadRecent());

  const trimmed = useMemo(() => dq.trim(), [dq]);
  const canSearch = trimmed.length >= 2;

  function commitRecentQuery(query: string) {
    const t = query.trim();
    if (t.length < 2) return;

    setRecent((prev) => {
      const next = [t, ...prev.filter((x) => x !== t)].slice(0, 8);
      saveRecent(next);
      return next;
    });
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        setQ("");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!canSearch) {
        setResults([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await searchTmdb(trimmed, type);
        if (cancelled) return;
        setResults(data.results ?? []);
      } catch {
        if (cancelled) return;
        setError("Search failed. Is the backend running?");
        setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [trimmed, canSearch, type]);

  useEffect(() => {
    let cancelled = false;

    async function runTrending() {
      if (canSearch) return;

      setTrendLoading(true);
      setTrendError(null);

      try {
        const trendingType = type === "multi" ? "all" : type;
        const data = await trendingTmdb(trendingType, trendWindow);
        if (cancelled) return;
        setTrending(data.results ?? []);
      } catch {
        if (cancelled) return;
        setTrendError("Trending failed. Is the backend running?");
        setTrending([]);
      } finally {
        if (!cancelled) setTrendLoading(false);
      }
    }

    runTrending();
    return () => {
      cancelled = true;
    };
  }, [canSearch, trendWindow, type]);

  const featured = !canSearch ? trending[0] : undefined;

  function clearSearchHistory() {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {}
    setRecent([]);
    if (!canSearch) setQ("");
  }

  return (
    <div className="min-h-screen bg-[#050A18] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#081433] via-[#050A18] to-[#030611]" />

        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(56,189,248,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_80%_12%,rgba(99,102,241,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(700px_circle_at_50%_-10%,rgba(255,255,255,0.08),transparent_55%)]" />

        <div className="absolute -top-56 left-1/2 h-[700px] w-[1200px] -translate-x-1/2 rounded-full bg-sky-500/12 blur-[100px]" />
        <div className="absolute -top-32 left-[8%] h-[560px] w-[560px] rounded-full bg-blue-500/18 blur-[100px]" />
        <div className="absolute -top-32 right-[10%] h-[560px] w-[560px] rounded-full bg-indigo-500/16 blur-[100px]" />

        <div className="absolute inset-0 opacity-[0.45]">
          <div className="absolute -left-24 top-28 h-[560px] w-[560px] rotate-12 rounded-[56px] bg-gradient-to-br from-white/12 to-transparent blur-md" />
          <div className="absolute right-0 top-40 h-[620px] w-[620px] -rotate-6 rounded-[64px] bg-gradient-to-tr from-white/12 to-transparent blur-md" />
        </div>

        <div className="absolute inset-0 opacity-[0.09]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:72px_72px]" />
        </div>

        <div
          className="absolute inset-0 opacity-[0.10] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.40'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.92)_100%)]" />
      </div>

      <main className="relative mx-auto max-w-6xl px-4 pb-14 pt-16 sm:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            What are we watching today?
          </h1>
          <p className="mx-auto mt-3 max-w-prose text-sm leading-relaxed text-zinc-400">
            Search movies and TV instantly. Pick a title and jump straight into details.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <div className="rounded-3xl bg-white/[0.04] p-4 ring-1 ring-white/[0.08] backdrop-blur-xl sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              <Pill active={type === "multi"} onClick={() => setType("multi")}>
                All
              </Pill>
              <Pill active={type === "movie"} onClick={() => setType("movie")}>
                Movies
              </Pill>
              <Pill active={type === "tv"} onClick={() => setType("tv")}>
                TV
              </Pill>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16.5 16.5 21 21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search a title…"
                className={[
                  "w-full rounded-2xl bg-zinc-950/50",
                  "px-11 py-4 text-sm outline-none",
                  "ring-1 ring-white/10 placeholder:text-zinc-500",
                  "focus:ring-2 focus:ring-white/20",
                ].join(" ")}
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="hidden sm:inline rounded-full bg-white/10 px-2 py-1 text-[11px] text-zinc-300 ring-1 ring-white/10">
                  {loading ? "Searching…" : type.toUpperCase()}
                </span>

                <button
                  onClick={() => setQ("")}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs text-zinc-200 ring-1 ring-white/10 hover:bg-white/15"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400">
              {!canSearch ? (
                <>
                  <span className="text-zinc-500">Type at least 2 characters.</span>
                  {recent.length > 0 ? (
                    <>
                      <span className="text-zinc-700">•</span>
                      {recent.slice(0, 6).map((r) => (
                        <button
                          key={r}
                          onClick={() => setQ(r)}
                          className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-zinc-200 ring-1 ring-white/[0.08] hover:bg-white/[0.1]"
                        >
                          {r}
                        </button>
                      ))}
                      <span className="text-zinc-700">•</span>
                      <button
                        onClick={clearSearchHistory}
                        className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-zinc-200 ring-1 ring-white/[0.08] hover:bg-white/[0.1]"
                      >
                        Clear history
                      </button>
                    </>
                  ) : null}
                </>
              ) : null}

              {error ? <span className="text-red-300">{error}</span> : null}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-6xl">
          {canSearch ? (
            loading && results.length === 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-zinc-400">
                    <span className="text-zinc-200">{results.length}</span> results
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {results.map((r) => (
                    <ResultCard
                      key={`${r.type}:${r.id}`}
                      item={r}
                      onOpen={() => {
                        commitRecentQuery(trimmed);
                        nav(`/title/${r.type}/${r.id}`);
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-2xl bg-white/[0.03] p-8 text-center text-sm text-zinc-400 ring-1 ring-white/[0.06]">
                No results.
              </div>
            )
          ) : (
            <>
              {featured && (
                <FeaturedHero
                  item={featured}
                  onPlay={() => nav(`/title/${featured.type}/${featured.id}`)}
                  onDetails={() => nav(`/title/${featured.type}/${featured.id}`)}
                  onSeeMore={() =>
                    trendGridRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }
                />
              )}

              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-zinc-200">
                  Trending{" "}
                  <span className="text-zinc-400">
                    {trendWindow === "day" ? "today" : "this week"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Pill active={trendWindow === "day"} onClick={() => setTrendWindow("day")}>
                    Today
                  </Pill>
                  <Pill active={trendWindow === "week"} onClick={() => setTrendWindow("week")}>
                    Week
                  </Pill>
                </div>
              </div>

              <div ref={trendGridRef}>
                {trendLoading && trending.length === 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : trendError ? (
                  <div className="rounded-2xl bg-white/[0.03] p-8 text-center text-sm text-red-300 ring-1 ring-white/[0.06]">
                    {trendError}
                  </div>
                ) : trending.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {trending.map((r) => (
                      <ResultCard
                        key={`trend:${r.type}:${r.id}`}
                        item={r}
                        onOpen={() => nav(`/title/${r.type}/${r.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/[0.03] p-8 text-center text-sm text-zinc-400 ring-1 ring-white/[0.06]">
                    No trending results.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
