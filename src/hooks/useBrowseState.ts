"use client";

import { useSyncExternalStore } from "react";
import { defaultBrowseSelection, getBrowseSelection, subscribeToBrowseSelection } from "../lib/browseState";

export function useBrowseState() {
  return useSyncExternalStore(subscribeToBrowseSelection, getBrowseSelection, () => defaultBrowseSelection);
}
