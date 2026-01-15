import ServiceError from "../core/ServiceError";

export type StreamOptions = {
  color?: string;
  autoPlay?: boolean;
  nextEpisode?: boolean;
  episodeSelector?: boolean;
  progress?: number;
};

const rawStreamSource = process.env.STREAM_SOURCE;
if (!rawStreamSource) {
  throw new Error("STREAM_SOURCE environment variable is not set");
}
const STREAM_SOURCE = rawStreamSource.replace(/\/+$/, "");

function parsePosInt(raw: unknown, field: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    throw ServiceError.validationFailed(`${field} must be a positive integer`);
  }
  return n;
}

function buildUrl(path: string, opts: StreamOptions) {
  const url = new URL(STREAM_SOURCE + path);

  if (opts.color) url.searchParams.set("color", opts.color);
  if (opts.autoPlay === true) url.searchParams.set("autoPlay", "true");
  if (opts.nextEpisode === true) url.searchParams.set("nextEpisode", "true");
  if (opts.episodeSelector === true) url.searchParams.set("episodeSelector", "true");
  if (opts.progress !== undefined) url.searchParams.set("progress", String(Math.floor(opts.progress)));

  return url.toString();
}

export async function getMovieStreamUrl(tmdbIdRaw: unknown, opts: StreamOptions = {}) {
  const tmdbId = parsePosInt(tmdbIdRaw, "tmdbId");

  if (opts.nextEpisode !== undefined || opts.episodeSelector !== undefined) {
    throw ServiceError.validationFailed("nextEpisode/episodeSelector are only valid for TV shows");
  }

  return { url: buildUrl(`/embed/movie/${tmdbId}`, opts) };
}

export async function getTvStreamUrl(
  tmdbIdRaw: unknown,
  seasonRaw: unknown,
  episodeRaw: unknown,
  opts: StreamOptions = {}
) {
  const tmdbId = parsePosInt(tmdbIdRaw, "tmdbId");
  const season = parsePosInt(seasonRaw, "season");
  const episode = parsePosInt(episodeRaw, "episode");

  return { url: buildUrl(`/embed/tv/${tmdbId}/${season}/${episode}`, opts) };
}
