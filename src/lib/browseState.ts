import type { Genre, MediaType } from "../api/tmdb";

type BrowseSelection = {
  trendingType: MediaType;
  topRatedType: MediaType;
  genreType: MediaType;
  genre: Genre | null;
};
type BrowseSnapshot = { selection: BrowseSelection; positions: Record<string, number> };

const STORAGE_KEY = "xalonstream:browse:v1";
export const defaultBrowseSelection: BrowseSelection = {
  trendingType: "movie", topRatedType: "movie", genreType: "movie", genre: null,
};

let selection = defaultBrowseSelection;
let positions: Record<string, number> = {};
let pendingReturn: BrowseSnapshot | null = null;
let restoreOnEntry = false;
let homeActive = false;
let initialized = false;
let currentPath = "";
const listeners = new Set<() => void>();

function clearStoredSnapshot() {
  // Remove snapshots left by older versions; navigation state is now memory-only.
  try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* storage is optional */ }
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* storage is optional */ }
}

function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  currentPath = window.location.pathname;
  clearStoredSnapshot();
  window.addEventListener("popstate", () => {
    const destination = window.location.pathname;
    restoreOnEntry = destination === "/" && currentPath.startsWith("/title/") && pendingReturn !== null;
    if (destination === "/") homeActive = false;
    currentPath = destination;
  }, { capture: true });
  window.addEventListener("pagehide", () => {
    pendingReturn = null;
    restoreOnEntry = false;
    homeActive = false;
    selection = defaultBrowseSelection;
    positions = {};
  });
}

function enterHome() {
  initialize();
  if (typeof window === "undefined" || window.location.pathname !== "/" || homeActive) return;
  const snapshot = restoreOnEntry ? pendingReturn : null;
  selection = snapshot?.selection ?? defaultBrowseSelection;
  positions = snapshot?.positions ?? {};
  homeActive = true;
  // Consume the snapshot once; the restored values are only the live page state.
  pendingReturn = null;
  restoreOnEntry = false;
  clearStoredSnapshot();
}

export function trackBrowsePath(pathname: string) {
  initialize();
  currentPath = pathname;
  if (pathname !== "/") homeActive = false;
  if (pathname !== "/" && !pathname.startsWith("/title/")) pendingReturn = null;
}

export function rememberBrowseForDetails() {
  enterHome();
  if (typeof window === "undefined" || window.location.pathname !== "/") return;
  pendingReturn = { selection: { ...selection }, positions: { ...positions, "home:page": window.scrollY } };
}

export function getBrowseSelection() {
  enterHome();
  return selection;
}

export function subscribeToBrowseSelection(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function updateBrowseSelection(update: Partial<BrowseSelection>) {
  enterHome();
  if (Object.entries(update).every(([key, value]) => selection[key as keyof BrowseSelection] === value)) return;
  selection = { ...selection, ...update };
  listeners.forEach(listener => listener());
}

export function getBrowsePosition(key: string) {
  enterHome();
  return positions[key] ?? 0;
}

export function saveBrowsePosition(key: string, value: number) {
  enterHome();
  if (!homeActive || window.location.pathname !== "/" || !Number.isFinite(value)) return;
  positions[key] = Math.max(0, value);
}
