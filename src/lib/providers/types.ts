export type MediaType = "movie" | "tv";
export interface ProviderInput {
  name: string;
  baseUrl: string;
  movieTemplate: string | null;
  tvTemplate: string | null;
  enabled: boolean;
  isDefault: boolean;
}
export interface Provider extends ProviderInput {
  id: string;
  priority: number;
  createdAt: number;
  updatedAt: number;
}
