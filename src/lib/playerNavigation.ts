import type { MediaType } from "./providers/types";

export function playerReturnTo(raw: string | null, type: MediaType, tmdbId: number) {
  const fallback = Number.isSafeInteger(tmdbId) && tmdbId > 0 ? `/title/${type}/${tmdbId}` : "/";
  if (!raw?.startsWith("/") || raw.startsWith("//") || /[\\\x00-\x1f\x7f]/.test(raw)) return fallback;
  try {
    const url = new URL(raw, "https://streaming.invalid");
    const browsingPage = /^(?:\/|\/title\/(?:movie|tv)\/[1-9]\d*\/?|\/actor\/[1-9]\d*\/?)$/;
    if (url.origin !== "https://streaming.invalid" || !browsingPage.test(url.pathname)) return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}

export function playerHref(type: MediaType, tmdbId: number, returnTo: string, season = 1, episode = 1) {
  const path = type === "tv" ? `/play/tv/${tmdbId}/${season}/${episode}` : `/play/movie/${tmdbId}`;
  const query = new URLSearchParams({ returnTo: playerReturnTo(returnTo, type, tmdbId) });
  return `${path}?${query}`;
}
