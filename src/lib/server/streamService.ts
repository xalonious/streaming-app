import "server-only";
import { resolveStream } from "./providers/service";
export async function getMovieStreamUrl(tmdbId: unknown, providerId?: string) {
  return resolveStream("movie", Number(tmdbId), undefined, undefined, providerId);
}
export async function getTvStreamUrl(tmdbId: unknown, season: unknown, episode: unknown, providerId?: string) {
  return resolveStream("tv", Number(tmdbId), Number(season), Number(episode), providerId);
}
