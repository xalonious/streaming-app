import "server-only";
import axios from "axios";
import { getCache } from "./cache/cache";
import { cacheKey, type TmdbParams } from "./cache/keys";
import { ttlFor } from "./cache/policies";
import { CACHE_CONFIG } from "./cache/config";

const state = globalThis as typeof globalThis & { tmdbLimiter?: { active: number; waiting: (() => void)[] } };
const limiter = state.tmdbLimiter ??= { active: 0, waiting: [] };
async function upstream(path: string, params: TmdbParams) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY is missing");
  if (limiter.active >= CACHE_CONFIG.concurrency) await new Promise<void>(resolve => limiter.waiting.push(resolve));
  else limiter.active++;
  try {
    for (let attempt = 0; ; attempt++) {
      getCache().count("upstreamRequests");
      try {
        return await axios.get(`https://api.themoviedb.org/3${path}`, { params: { ...params, api_key: apiKey }, timeout: 15000 });
      } catch (error) {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (attempt >= 2 || (status !== undefined && status !== 429 && status < 500)) throw error;
        const retry = Number(axios.isAxiosError(error) ? error.response?.headers["retry-after"] : 0);
        if (retry > 5) throw error;
        await new Promise(resolve => setTimeout(resolve, Math.max(250 * 2 ** attempt, retry * 1000 || 0)));
      }
    }
  } finally { const next = limiter.waiting.shift(); if (next) next(); else limiter.active--; }
}
export function createTmdbClient() {
  return {
    async get(path: string, options: { params?: TmdbParams } = {}) {
      const params = options.params ?? {};
      const data = await getCache().get(cacheKey(path, params), ttlFor(path), async () => {
        const response = await upstream(path, params);
        return { data: response.data, headers: response.headers };
      });
      return { data };
    },
  };
}
