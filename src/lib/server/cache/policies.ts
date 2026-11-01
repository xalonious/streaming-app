import "server-only";
import { CACHE_CONFIG } from "./config";
export function ttlFor(path: string) {
  const t = CACHE_CONFIG.ttl;
  if (path.startsWith("/trending/")) return t.trending;
  if (path.startsWith("/search/")) return t.search;
  if (path.startsWith("/person/")) return t.people;
  if (path.startsWith("/genre/") || path.startsWith("/configuration")) return t.genres;
  if (/\/external_ids$/.test(path)) return t.mappings;
  if (/\/(recommendations|similar)$/.test(path)) return t.recommendations;
  if (/\/top_rated$/.test(path)) return t.topRated;
  if (/\/(now_playing|on_the_air|airing_today)$/.test(path)) return t.nowPlaying;
  if (/\/upcoming$/.test(path)) return t.upcoming;
  if (/\/popular$/.test(path) || path.startsWith("/discover/")) return t.popular;
  if (/^\/tv\/\d+\/(season|episode)/.test(path)) return t.tvSeasons;
  if (/^\/movie\/\d+(\/images)?$/.test(path) || path.startsWith("/collection/")) return t.movieDetails;
  return t.tvDetails;
}
export function retention(ttl: number, headers: Record<string, unknown>, now: number) {
  const control = String(headers["cache-control"] ?? "").toLowerCase();
  if (/\b(no-store|private|no-cache)\b/.test(control)) return { ttl: 0, stale: 0 };
  const age = Math.max(0, Number(headers.age) || 0) * 1000;
  const maxAge = /(?:^|,)\s*max-age\s*=\s*"?(\d+)/.exec(control);
  if (maxAge) ttl = Math.min(ttl, Math.max(0, Number(maxAge[1]) * 1000 - age));
  else if (headers.expires) {
    const expires = Date.parse(String(headers.expires));
    if (Number.isFinite(expires)) ttl = Math.min(ttl, Math.max(0, expires - now));
  }
  const swr = /\bstale-while-revalidate\s*=\s*"?(\d+)/.exec(control);
  const stale = /\b(must-revalidate|proxy-revalidate)\b/.test(control) ? 0
    : Math.min(CACHE_CONFIG.staleGrace, swr ? Number(swr[1]) * 1000 : CACHE_CONFIG.staleGrace);
  return { ttl, stale: ttl === 0 ? 0 : stale };
}
