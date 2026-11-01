import "server-only";
import { getDatabase } from "../db/connection";
import { ProviderRepository } from "./repository";
import { resolveTemplate, selectProvider } from "../../providers/templates";
import type { MediaType } from "../../providers/types";
import ServiceError from "../ServiceError";

export const providers = () => new ProviderRepository(getDatabase());
export function resolveStream(type: MediaType, tmdbId: number, season?: number, episode?: number, providerId?: string) {
  const list = providers().list();
  const provider = selectProvider(list, type, providerId);
  if (!provider) throw ServiceError.notFound(`No enabled ${type === "movie" ? "movie" : "TV"} providers. Add a source in the homepage settings.`);
  const template = (type === "movie" ? provider.movieTemplate : provider.tvTemplate)!;
  try { return { url: resolveTemplate(template, type, { tmdbId, season, episode }), providerId: provider.id }; }
  catch (error) { throw ServiceError.validationFailed((error as Error).message); }
}
