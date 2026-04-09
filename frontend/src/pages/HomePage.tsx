import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { SearchOverlay } from "../components/SearchOverlay";
import { HeroSection } from "../components/HeroSection";
import { Top10Carousel } from "../components/Top10Carousel";
import { TrendingRow } from "../components/TrendingRow";
import { useTmdbTrending } from "../hooks/useTmdbTrending";

export default function HomePage() {
  const nav = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [trendWindow, setTrendWindow] = useState<"day" | "week">("day");

  const { trending: mainItems, loading: mainLoading } = useTmdbTrending({ type: "multi", window: "day", enabled: true });
  const { trending: trendingItems } = useTmdbTrending({ type: trendWindow === "day" ? "movie" : "tv", window: "day", enabled: true });

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

  const hero = mainItems[0];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <Navbar onSearchOpen={() => setSearchOpen(true)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {mainLoading ? (
        <div className="w-full bg-black animate-pulse" style={{ height: "91vh", minHeight: 500 }} />
      ) : hero ? (
        <HeroSection
          item={hero}
          onPlay={() => nav(`/title/${hero.type}/${hero.id}`)}
          onDetails={() => nav(`/title/${hero.type}/${hero.id}`)}
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

      </div>

      <div className="h-16" />
    </div>
  );
}