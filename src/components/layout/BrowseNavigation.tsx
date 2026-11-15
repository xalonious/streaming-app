"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { trackBrowsePath } from "../../lib/browseState";

export function BrowseNavigation() {
  const pathname = usePathname();
  useLayoutEffect(() => { trackBrowsePath(pathname); }, [pathname]);
  return null;
}
