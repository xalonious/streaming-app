import apiClient from "./axiosInstance";

export type MediaType = "movie" | "tv";

export interface SearchResult {
  id: number;
  type: MediaType;
  title: string;
  year: string | null;
  poster: string | null;
  overview: string;
}

export interface SearchResponse {
  results: SearchResult[];
}

export const searchTmdb = async (
  q: string,
  type: "multi" | "movie" | "tv" = "multi"
) => {
  const res = await apiClient.get<SearchResponse>("/api/tmdb/search", {
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
  const res = await apiClient.get<TrendingResponse>("/api/tmdb/trending", {
    params: { type, window },
  });
  return res.data;
};
