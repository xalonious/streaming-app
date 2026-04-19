import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trendingTmdb, topRatedTmdb, type SearchResult } from "../api/tmdb";
import { Navbar } from "../components/Navbar";
import { SearchOverlay } from "../components/SearchOverlay";
import { HeroSection } from "../components/HeroSection";
import { Top10Carousel } from "../components/Top10Carousel";
import { TrendingRow } from "../components/TrendingRow";
import { TopRatedRow } from "../components/TopRatedRow";
import { GenreRow } from "../components/GenreRow";

export default function HomePage() {
  const nav = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  const [mainItems, setMainItems] = useState<SearchResult[]>([]);
  const [mainLoading, setMainLoading] = useState(true);

  const [trendingItems, setTrendingItems] = useState<SearchResult[]>([]);
  const [trendWindow, setTrendWindow] = useState<"day" | "week">("day");
  const [topRatedItems, setTopRatedItems] = useState<SearchResult[]>([]);
  const [topRatedType, setTopRatedType] = useState<"movie" | "tv">("movie");

  useEffect(() => { document.title = "StreamVault"; }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let cancelled = false;
    trendingTmdb("all", "day")
      .then((data) => { if (!cancelled) setMainItems(data.results ?? []); })
      .catch(() => { if (!cancelled) setMainItems([]); })
      .finally(() => { if (!cancelled) setMainLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    topRatedTmdb(topRatedType)
      .then(d => { if (!cancelled) setTopRatedItems(d.results ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [topRatedType]);

  useEffect(() => {
    let cancelled = false;
    const type = trendWindow === "day" ? "movie" : "tv";
    trendingTmdb(type, "day")
      .then((data) => { if (!cancelled) setTrendingItems(data.results ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [trendWindow]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <Navbar onSearchOpen={() => setSearchOpen(true)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      {mainLoading ? (
        <div className="w-full bg-black animate-pulse" style={{ height: "91vh", minHeight: 500 }} />
      ) : mainItems.length > 0 ? (
        <HeroSection
          items={mainItems}
          onPlay={(item) => item.type === "movie"
            ? nav(`/play/movie/${item.id}`)
            : nav(`/play/tv/${item.id}/1/1`)}
          onDetails={(item) => nav(`/title/${item.type}/${item.id}`)}
        />
      ) : null}

      <div className="mx-auto max-w-[1400px]">
        {mainLoading ? (
          <div className="px-4 sm:px-6 py-8">
            <div className="h-20 w-64 bg-white/5 rounded animate-pulse mb-6" />
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0" style={{ width: 240 }}>
                  <div className="aspect-[2/3] rounded-xl bg-white/[0.06] animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : mainItems.length > 0 ? (
          <Top10Carousel items={mainItems} onOpen={(item) => nav(`/title/${item.type}/${item.id}`)} />
        ) : null}
        {trendingItems.length > 0 && (
          <TrendingRow
            items={trendingItems}
            onOpen={(item) => nav(`/title/${item.type}/${item.id}`)}
            trendWindow={trendWindow}
            onTrendWindowChange={setTrendWindow}
          />
        )}

        {topRatedItems.length > 0 && (
          <TopRatedRow
            items={topRatedItems}
            onOpen={(item) => nav(`/title/${item.type}/${item.id}`)}
            type={topRatedType}
            onTypeChange={setTopRatedType}
          />
        )}

        <GenreRow onOpen={(item) => nav(`/title/${item.type}/${item.id}`)} />

      </div>

      <div className="h-16" />
    </div>
  );
}