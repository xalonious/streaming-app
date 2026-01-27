import axios from "axios";
import ServiceError from "../core/ServiceError";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) {
  throw new Error("TMDB_API_KEY is missing");
}

const client = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  params: {
    api_key: TMDB_API_KEY,
  },
  timeout: 15000,
});

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

function normalizeSearchResult(r: any) {
  const type = (r.media_type ?? (r.title ? "movie" : "tv")) as "movie" | "tv";
  return {
    id: r.id,
    type,
    title: r.title ?? r.name ?? "",
    year: ((r.release_date ?? r.first_air_date ?? "").slice(0, 4) || null) as
      | string
      | null,
    poster: r.poster_path ? `${IMG_BASE}${r.poster_path}` : null,
    overview: r.overview ?? "",
  };
}

export async function search(
  query: string,
  type: "multi" | "movie" | "tv" = "multi"
) {
  const endpoint =
    type === "movie"
      ? "/search/movie"
      : type === "tv"
      ? "/search/tv"
      : "/search/multi";

  try {
    const { data } = await client.get(endpoint, {
      params: {
        query,
        include_adult: false,
      },
    });

    const results = (data?.results ?? [])
      .filter((r: any) => r.media_type !== "person")
      .map(normalizeSearchResult);

    return { results };
  } catch (err: any) {
    throw ServiceError.internalServerError(`TMDB search failed: ${err.message}`);
  }
}

export async function getTrending(
  type: "all" | "movie" | "tv" = "all",
  window: "day" | "week" = "day"
) {
  const endpoint = `/trending/${type}/${window}`;

  try {
    const { data } = await client.get(endpoint, {
      params: {
        include_adult: false,
      },
    });

    const results = (data?.results ?? [])
      .filter((r: any) => r.media_type !== "person")
      .map(normalizeSearchResult);

    return { results };
  } catch (err: any) {
    throw ServiceError.internalServerError(
      `TMDB trending failed: ${err.message}`
    );
  }
}

export async function getMovieDetails(tmdbId: number) {
  try {
    const { data } = await client.get(`/movie/${tmdbId}`);
    return data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      throw ServiceError.notFound(`Movie not found: ${tmdbId}`);
    }
    throw ServiceError.internalServerError(
      `TMDB movie details failed: ${err.message}`
    );
  }
}

export async function getTvDetails(tmdbId: number) {
  try {
    const { data } = await client.get(`/tv/${tmdbId}`);
    return data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      throw ServiceError.notFound(`TV show not found: ${tmdbId}`);
    }
    throw ServiceError.internalServerError(
      `TMDB tv details failed: ${err.message}`
    );
  }
}

export async function getTvSeasonDetails(tmdbId: number, season: number) {
  try {
    const { data } = await client.get(`/tv/${tmdbId}/season/${season}`);
    return data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      throw ServiceError.notFound(
        `Season not found: tv=${tmdbId} season=${season}`
      );
    }
    throw ServiceError.internalServerError(
      `TMDB season details failed: ${err.message}`
    );
  }
}

export async function getTvAllEpisodes(tmdbId: number) {
  const tv = await getTvDetails(tmdbId);

  const seasons: Array<{ season_number: number; id?: number; name?: string }> =
    Array.isArray(tv?.seasons) ? tv.seasons : [];

  if (seasons.length === 0) {
    return {
      tmdbId,
      tvId: tv?.id ?? tmdbId,
      episodes: [],
      totalEpisodes: 0,
      totalSeasons: 0,
    };
  }

  try {
    const seasonDetails = await Promise.all(
      seasons.map(async (s) => {
        const seasonNumber = Number(s.season_number);
        const { data } = await client.get(
          `/tv/${tmdbId}/season/${seasonNumber}`
        );
        return { seasonNumber, data };
      })
    );

    const episodes = seasonDetails.flatMap(({ seasonNumber, data }) => {
      const eps = Array.isArray(data?.episodes) ? data.episodes : [];
      return eps.map((ep: any) => ({
        tvId: tmdbId,
        season: seasonNumber,
        episode: ep.episode_number,
        id: ep.id,
        name: ep.name ?? "",
        overview: ep.overview ?? "",
        air_date: ep.air_date ?? null,
        still: ep.still_path ? `${IMG_BASE}${ep.still_path}` : null,
        runtime: ep.runtime ?? null,
      }));
    });

    episodes.sort((a, b) => a.season - b.season || a.episode - b.episode);

    return {
      tmdbId,
      tvId: tv?.id ?? tmdbId,
      episodes,
      totalEpisodes: episodes.length,
      totalSeasons: seasons.length,
    };
  } catch (err: any) {
    throw ServiceError.internalServerError(
      `TMDB all episodes failed: ${err.message}`
    );
  }
}
