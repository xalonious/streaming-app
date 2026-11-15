import type { Genre, MediaType } from "../api/tmdb";

type BrowseSelection = {
  trendingType: MediaType;
  topRatedType: MediaType;
  genreType: MediaType;
  genre: Genre | null;
};

const STORAGE_KEY = "xalonstream:browse:v1";
export const defaultBrowseSelection: BrowseSelection = {
  trendingType: "movie",
  topRatedType: "movie",
  genreType: "movie",
  genre: null,
};

let selection = defaultBrowseSelection;
let positions: Record<string, number> = {};
let initialized = false;
let persistTimer: number | undefined;
const listeners = new Set<() => void>();

function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (!saved || typeof saved !== "object") return;
    const isMediaType = (value: unknown): value is MediaType => value === "movie" || value === "tv";
    selection = {
      trendingType: isMediaType(saved.trendingType) ? saved.trendingType : "movie",
      topRatedType: isMediaType(saved.topRatedType) ? saved.topRatedType : "movie",
      genreType: isMediaType(saved.genreType) ? saved.genreType : "movie",
      genre: Number.isInteger(saved.genre?.id) && saved.genre.id > 0 && typeof saved.genre.name === "string"
        ? { id: saved.genre.id, name: saved.genre.name } : null,
    };
    if (saved.positions && typeof saved.positions === "object") {
      positions = Object.fromEntries(Object.entries(saved.positions).filter(
        ([, value]) => typeof value === "number" && Number.isFinite(value) && value >= 0,
      )) as Record<string, number>;
    }
  } catch {
    // Storage can be unavailable or contain an older, invalid snapshot.
  }
}

export function getBrowseSelection() {
  initialize();
  return selection;
}

export function subscribeToBrowseSelection(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function updateBrowseSelection(update: Partial<BrowseSelection>) {
  initialize();
  if (Object.entries(update).every(([key, value]) => selection[key as keyof BrowseSelection] === value)) return;
  selection = { ...selection, ...update };
  persistBrowseState();
  listeners.forEach(listener => listener());
}

export function getBrowsePosition(key: string) {
  initialize();
  return positions[key] ?? 0;
}

export function saveBrowsePosition(key: string, value: number) {
  initialize();
  if (!Number.isFinite(value)) return;
  positions[key] = Math.max(0, value);
  // Keep scrolling off React's render path and batch storage writes.
  if (persistTimer === undefined) persistTimer = window.setTimeout(persistBrowseState, 200);
}

export function persistBrowseState() {
  if (typeof window === "undefined") return;
  initialize();
  window.clearTimeout(persistTimer);
  persistTimer = undefined;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...selection, positions }));
  } catch {
    // In-memory restoration still works when storage is disabled or full.
  }
}
