import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trendingTmdb, topRatedTmdb, type SearchResult } from "../api/tmdb";
import { Navbar } from "../components/layout/Navbar";
import { SearchOverlay } from "../components/ui/SearchOverlay";
import { HeroSection } from "../components/layout/HeroSection";
import { PosterCarousel } from "../components/rows/PosterCarousel";
import { MediaTypeToggle } from "../components/ui/MediaTypeToggle";
import { GenreRow } from "../components/rows/GenreRow";

export default function HomePage() {
  const nav = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  const [mainItems, setMainItems] = useState<SearchResult[]>([]);
  const [mainLoading, setMainLoading] = useState(true);

  const [trendingItems, setTrendingItems] = useState<SearchResult[]>([]);
  const [trendWindow, setTrendWindow] = useState<"day" | "week">("day");
  const [topRatedItems, setTopRatedItems] = useState<SearchResult[]>([]);
  const [topRatedType, setTopRatedType] = useState<"movie" | "tv">("movie");

  useEffect(() => { document.title = "Streaming"; }, []);

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

  const openTitle = (item: SearchResult) => nav(`/title/${item.type}/${item.id}`);

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
        ) : (
          <PosterCarousel
            title="TOP 10 Today"
            items={mainItems.slice(0, 10)}
            onOpen={openTitle}
            badge
            scrollAmount={500}
            sectionClassName="px-4 sm:px-6 pt-4 pb-8"
          />
        )}

        <PosterCarousel
          title={<>Trending <span className="text-zinc-400 font-normal">Today</span></>}
          items={trendingItems}
          onOpen={openTitle}
          resetKey={trendWindow}
          rightContent={
            <MediaTypeToggle
              value={trendWindow}
              options={[{ label: "Movies", value: "day" }, { label: "Series", value: "week" }]}
              onChange={(v) => setTrendWindow(v)}
            />
          }
        />

        <PosterCarousel
          title="Top rated"
          items={topRatedItems}
          onOpen={openTitle}
          resetKey={topRatedType}
          rightContent={
            <MediaTypeToggle
              value={topRatedType}
              options={[{ label: "Movies", value: "movie" }, { label: "Series", value: "tv" }]}
              onChange={(v) => setTopRatedType(v)}
            />
          }
        />

        <GenreRow onOpen={openTitle} />
      </div>

      <div className="h-16" />
    </div>
  );
}
