import apiClient from "./axiosInstance";

export const getMovieDetails = async (id: number) => {
  const res = await apiClient.get(`/api/tmdb/movie/${id}`);
  return res.data;
};

export const getTvDetails = async (id: number) => {
  const res = await apiClient.get(`/api/tmdb/tv/${id}`);
  return res.data;
};

export const getTvSeason = async (id: number, season: number) => {
  const res = await apiClient.get(`/api/tmdb/tv/${id}/season/${season}`);
  return res.data;
};

export const getTvAllEpisodes = async (id: number) => {
  const res = await apiClient.get(`/api/tmdb/tv/${id}/episodes`);
  return res.data;
};
