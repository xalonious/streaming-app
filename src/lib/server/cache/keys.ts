import "server-only";
export type TmdbParams = Record<string, string | number | boolean | null | undefined>;
export function cacheKey(path: string, params: TmdbParams = {}) {
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(name, String(value));
  }
  for (const key of [...url.searchParams.keys()]) {
    if (/api_key|token|authorization/i.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  return `tmdb:${url.pathname}?${url.searchParams.toString()}`;
}
