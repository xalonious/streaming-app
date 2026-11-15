"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveRating } from "../../hooks/useLiveRating";
import type { RatedMedia, RatingIdentity } from "../../lib/ratings";
import { StarIcon } from "./Icons";

export function LiveRating({ item, separator, valueClassName = "text-zinc-300" }: {
  item: RatedMedia & RatingIdentity;
  separator?: string;
  valueClassName?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current?.parentElement;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "200px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const rating = useLiveRating(item.type, item.id, item, visible);
  return (
    <span ref={ref} className="inline-flex items-center gap-1">
      {rating.value !== null && rating.value >= 1 && <>
        {separator && <span className="text-zinc-600">{separator}</span>}
        <StarIcon source={rating.source} /><span className={valueClassName}>{rating.value.toFixed(1)}</span>
      </>}
    </span>
  );
}
