import { providerStorageKey } from "./templates";
import type { MediaType } from "./types";
type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;
export function readProviderPreference(type: MediaType, storage?: PreferenceStorage) {
  try { return (storage ?? localStorage).getItem(providerStorageKey(type)); } catch { return null; }
}
export function saveProviderPreference(type: MediaType, id: string, storage?: PreferenceStorage) {
  try { (storage ?? localStorage).setItem(providerStorageKey(type), id); } catch { /* storage is optional */ }
}
