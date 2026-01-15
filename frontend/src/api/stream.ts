import apiClient from "./axiosInstance";

export const getMovieStream = async (id: number) => {
  const res = await apiClient.get(`/api/streams/movie/${id}`, {
    params: { autoPlay: true, color: "e50914" },
  });
  return res.data as { url: string };
};

export const getTvStream = async (id: number, season: number, episode: number) => {
  const res = await apiClient.get(`/api/streams/tv/${id}/${season}/${episode}`, {
    params: { autoPlay: true, color: "e50914", nextEpisode: true, episodeSelector: true },
  });
  return res.data as { url: string };
};
