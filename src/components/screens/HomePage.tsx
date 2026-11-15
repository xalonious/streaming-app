"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trendingTmdb, topRatedTmdb, type MediaType, type SearchResult, type TopRatedResponse } from "../../api/tmdb";
import { Navbar } from "../layout/Navbar";
import { SearchOverlay } from "../ui/SearchOverlay";
import { HeroSection } from "../layout/HeroSection";
import { PosterCarousel } from "../rows/PosterCarousel";
import { MediaTypeToggle } from "../ui/MediaTypeToggle";
import { GenreRow } from "../rows/GenreRow";
import { IntroLoader } from "../ui/IntroLoader";
import { ProviderSettings } from "../ui/ProviderSettings";
import { playerHref } from "../../lib/playerNavigation";
import { useBrowseState } from "../../hooks/useBrowseState";
import { useBrowseScroll } from "../../hooks/useBrowseScroll";
import { updateBrowseSelection } from "../../lib/browseState";

const homeCache = {
  main: null as SearchResult[] | null,
  trending: new Map<MediaType, SearchResult[]>(),
  topRated: new Map<MediaType, TopRatedResponse>(),
};

export default function HomePage() {
  const router = useRouter();
  const { trendingType, topRatedType } = useBrowseState();
  const pageRef = useBrowseScroll();
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [mainItems, setMainItems] = useState<SearchResult[]>(() => homeCache.main ?? []);
  const [mainLoading, setMainLoading] = useState(() => homeCache.main === null);

  const [trending, setTrending] = useState(() => ({
    type: trendingType, items: homeCache.trending.get(trendingType),
  }));
  const trendingItems = trending.type === trendingType ? trending.items : homeCache.trending.get(trendingType);
  const [rated, setRated] = useState(() => ({
    type: topRatedType, data: homeCache.topRated.get(topRatedType),
  }));
  const topRated = rated.type === topRatedType ? rated.data : homeCache.topRated.get(topRatedType);

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
      .then((data) => {
        const items = data.results ?? [];
        homeCache.main = items;
        if (!cancelled) setMainItems(items);
      })
      .catch(() => {
        if (!cancelled && homeCache.main === null) setMainItems([]);
      })
      .finally(() => { if (!cancelled) setMainLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    topRatedTmdb(topRatedType)
      .then(d => {
        homeCache.topRated.set(topRatedType, d);
        if (!cancelled) setRated({ type: topRatedType, data: d });
      })
      .catch(() => {
        if (!cancelled) setRated({ type: topRatedType, data: homeCache.topRated.get(topRatedType) ?? { results: [], rankingSource: "tmdb" } });
      });
    return () => { cancelled = true; };
  }, [topRatedType]);

  useEffect(() => {
    let cancelled = false;
    trendingTmdb(trendingType, "day")
      .then((data) => {
        const items = data.results ?? [];
        homeCache.trending.set(trendingType, items);
        if (!cancelled) setTrending({ type: trendingType, items });
      })
      .catch(() => {
        if (!cancelled) setTrending({ type: trendingType, items: homeCache.trending.get(trendingType) ?? [] });
      });
    return () => { cancelled = true; };
  }, [trendingType]);

  const openTitle = (item: SearchResult) => router.push(`/title/${item.type}/${item.id}`, { scroll: false });

  return (
    <div ref={pageRef} className="home-page min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <IntroLoader loading={mainLoading} />
      <Navbar onSearchOpen={() => setSearchOpen(true)} onSettingsOpen={() => setSettingsOpen(true)} />
      {settingsOpen && <ProviderSettings onClose={() => setSettingsOpen(false)} />}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      {mainLoading ? (
        <div className="w-full bg-black animate-pulse" style={{ height: "91vh", minHeight: 500 }} />
      ) : mainItems.length > 0 ? (
        <HeroSection
          items={mainItems}
          onPlay={(item) => router.push(playerHref(item.type, item.id, window.location.pathname + window.location.search + window.location.hash), { scroll: false })}
          onDetails={openTitle}
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
            positionKey="home:top10"
            items={mainItems.slice(0, 10)}
            onOpen={openTitle}
            badge
            scrollAmount={500}
            sectionClassName="px-4 sm:px-6 pt-4 pb-8"
          />
        )}

        <PosterCarousel
          title={<>Trending <span className="text-zinc-400 font-normal">Today</span></>}
          items={trendingItems ?? []}
          loading={!trendingItems}
          onOpen={openTitle}
          positionKey={`home:trending:${trendingType}`}
          cardVariant="backdrop"
          scrollItems={4}
          rightContent={
            <MediaTypeToggle
              value={trendingType}
              options={[{ label: "Movies", value: "movie" }, { label: "Series", value: "tv" }]}
              onChange={(trendingType) => updateBrowseSelection({ trendingType })}
            />
          }
        />

        <PosterCarousel
          title="Top Rated"
          items={topRated?.results ?? []}
          loading={!topRated}
          onOpen={openTitle}
          positionKey={`home:top-rated:${topRatedType}`}
          cardVariant="backdrop"
          scrollItems={4}
          rightContent={
            <MediaTypeToggle
              value={topRatedType}
              options={[{ label: "Movies", value: "movie" }, { label: "Series", value: "tv" }]}
              onChange={(topRatedType) => updateBrowseSelection({ topRatedType })}
            />
          }
        />

        <GenreRow onOpen={openTitle} />
      </div>

      <div className="h-16" />
    </div>
  );
}
