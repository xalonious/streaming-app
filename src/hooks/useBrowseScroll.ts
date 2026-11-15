"use client";

import { useLayoutEffect, useRef } from "react";
import { getBrowsePosition, persistBrowseState, saveBrowsePosition } from "../lib/browseState";

const PAGE_KEY = "home:page";
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

export function useBrowseScroll() {
  const pageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const target = getBrowsePosition(PAGE_KEY);
    let restoring = true;
    let frame = 0;

    const record = () => {
      if (!restoring) saveBrowsePosition(PAGE_KEY, window.scrollY);
    };
    const stopRestoring = () => {
      restoring = false;
      observer.disconnect();
    };
    const restore = () => {
      if (!restoring) return;
      window.scrollTo({ top: target, behavior: "instant" });
      if (document.documentElement.scrollHeight - window.innerHeight >= target) stopRestoring();
    };
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(restore);
    });
    const onUserScroll = () => {
      stopRestoring();
      record();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) onUserScroll();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") persistBrowseState();
    };

    observer.observe(page);
    window.scrollTo({ top: target, behavior: "instant" });
    frame = requestAnimationFrame(restore);
    window.addEventListener("scroll", record, { passive: true });
    window.addEventListener("wheel", onUserScroll, { passive: true });
    window.addEventListener("touchstart", onUserScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pagehide", persistBrowseState);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", record);
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchstart", onUserScroll);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pagehide", persistBrowseState);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      persistBrowseState();
    };
  }, []);

  return pageRef;
}
