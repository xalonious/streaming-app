import "server-only";
import axios from "axios";

export function createTmdbClient() {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY is missing");
  return axios.create({
    baseURL: "https://api.themoviedb.org/3",
    params: { api_key: apiKey },
    timeout: 15000,
  });
}
