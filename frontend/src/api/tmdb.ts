import apiClient from "./axiosInstance";

export type MediaType = "movie" | "tv";

export interface SearchResult {
  id: number;
  type: MediaType;
  title: string;
  year: string | null;
  poster: string | null;
  backdrop: string | null;
  overview: string;
  vote_average: number | null;
}

export interface SearchResponse {
  results: SearchResult[];
}

export const searchTmdb = async (
  q: string,
  type: "multi" | "movie" | "tv" = "multi"
) => {
  const res = await apiClient.get<SearchResponse>("/tmdb/search", {
    params: { q, type },
  });
  return res.data;
};

export interface TrendingResponse {
  results: SearchResult[];
}

export const trendingTmdb = async (
  type: "all" | "movie" | "tv" = "all",
  window: "day" | "week" = "day"
) => {
  const res = await apiClient.get<TrendingResponse>("/tmdb/trending", {
    params: { type, window },
  });
  return res.data;
};

export const recommendationsTmdb = async (
  type: "movie" | "tv",
  tmdbId: number
) => {
  const res = await apiClient.get<{ results: SearchResult[] }>(
    `/tmdb/${type}/${tmdbId}/recommendations`
  );
  return res.data;
};

export const getTitleImages = async (type: "movie" | "tv", tmdbId: number) => {
  const res = await apiClient.get<{ logoUrl: string | null }>(
    `/tmdb/${type}/${tmdbId}/images`
  );
  return res.data;
};