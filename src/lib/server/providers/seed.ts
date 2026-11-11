import "server-only";
import type { DatabaseSync } from "node:sqlite";
import { validateProvider } from "./validation";
import { normalizeBaseUrl } from "../../providers/templates";

export function seedProviders(db: DatabaseSync, legacySource?: string) {
  const standard = {
    name: "VidSrc", baseUrl: "https://vidsrc.mov",
    movieTemplate: "https://vidsrc.mov/embed/movie/{tmdbId}",
    tvTemplate: "https://vidsrc.mov/embed/tv/{tmdbId}/{season}/{episode}",
  };
  const legacy = legacySource?.trim() ? normalizeBaseUrl(legacySource) : null;
  const custom = legacy && legacy !== standard.baseUrl ? validateProvider({
    name: "Migrated provider", baseUrl: legacy,
    movieTemplate: `${legacy}/embed/movie/{tmdbId}`,
    tvTemplate: `${legacy}/embed/tv/{tmdbId}/{season}/{episode}`, isDefault: true,
  }) : null;
  const insert = db.prepare(`INSERT OR IGNORE INTO stream_providers
    (id,name,base_url,movie_template,tv_template,enabled,is_default,priority,discovery_method,created_at,updated_at)
    VALUES (?,?,?,?,?,1,?,?,?,?,?)`);
  const now = Date.now();
  insert.run("vidsrc", standard.name, standard.baseUrl, standard.movieTemplate, standard.tvTemplate, custom ? 0 : 1, custom ? 1 : 0, "registry", now, now);
  if (custom) insert.run("legacy-source", custom.name, custom.baseUrl, custom.movieTemplate, custom.tvTemplate, 1, 0, "manual", now, now);
}
