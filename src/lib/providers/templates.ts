import type { MediaType, Provider } from "./types";

export function providerUrl(raw: string) {
  if (typeof raw !== "string" || raw.length > 2048 || /[\s<>"'`\\\x00-\x1f]/.test(raw)) throw new Error("Enter a valid HTTPS URL without HTML or whitespace");
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Enter an absolute HTTPS URL"); }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || url.hash) {
    throw new Error("Use HTTPS on port 443, without credentials or fragments");
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") || /(^|\.)(localhost|local|internal|lan|home|test|invalid)$/.test(host) || host.includes(":")) {
    throw new Error("Use a public provider domain");
  }
  if (/^[\d.]+$/.test(host)) throw new Error("Use a public domain, not an IP address");
  return url;
}

export function normalizeBaseUrl(raw: string) {
  const trimmed = raw.trim();
  const url = providerUrl(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  if (url.search || /[{}]/.test(raw)) throw new Error("Base URL cannot contain query parameters or placeholders");
  url.hostname = url.hostname.replace(/\.$/, "");
  return url.toString().replace(/\/+$/, "");
}

export function validateTemplate(template: string, type: MediaType, baseUrl?: string) {
  if (!template || template.length > 2048) throw new Error(`${type} template is empty or too long`);
  const required = type === "movie" ? ["tmdbId"] : ["tmdbId", "season", "episode"];
  const tokens = [...template.matchAll(/\{([^{}]+)\}/g)].map(m => m[1]);
  if (tokens.some(t => !required.includes(t))) throw new Error(`Unsupported placeholder in ${type} template`);
  for (const token of required) if (!tokens.includes(token)) throw new Error(`${type} template requires {${token}}`);
  const sample = template.replace(/\{([^{}]+)\}/g, "1");
  if (/[{}]/.test(sample)) throw new Error("Malformed placeholder");
  const url = providerUrl(sample);
  const authority = template.match(/^https:\/\/([^/?)]+)/)?.[1];
  if (!authority || /[{}]/.test(authority)) throw new Error("Placeholders belong in the path or query");
  if (baseUrl && url.origin !== providerUrl(baseUrl).origin) throw new Error("Template must use the same origin as the base URL");
  return template;
}

export function resolveTemplate(template: string, type: MediaType, values: { tmdbId: number; season?: number; episode?: number }) {
  validateTemplate(template, type);
  const url = template.replace(/\{(tmdbId|season|episode)\}/g, (_, key: keyof typeof values) => {
    const value = values[key];
    if (!Number.isSafeInteger(value) || value! <= 0) throw new Error(`${key} must be a positive integer`);
    return encodeURIComponent(String(value));
  });
  return providerUrl(url).toString();
}

export function compatibleProviders(providers: Provider[], type: MediaType) {
  return providers.filter(p => p.enabled && (type === "movie" ? p.movieTemplate : p.tvTemplate));
}
export function selectProvider(providers: Provider[], type: MediaType, preferred?: string | null) {
  const compatible = compatibleProviders(providers, type);
  return compatible.find(p => p.id === preferred) ?? compatible.find(p => p.isDefault) ?? compatible[0] ?? null;
}
export const providerStorageKey = (type: MediaType) => `xalonstream:provider:${type}`;
