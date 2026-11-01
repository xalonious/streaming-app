import type { Provider } from "../lib/providers/types";
export async function providerRequest<T>(path = "", options: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const response = await fetch(`/api/providers${path}`, {
    method: options.method ?? "GET", cache: "no-store", signal: options.signal,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Provider request failed");
  return data as T;
}
export const listProviders = (signal?: AbortSignal) => providerRequest<{ providers: Provider[] }>("", { signal });
