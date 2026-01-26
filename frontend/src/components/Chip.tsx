import React from "react";

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur">
      {children}
    </span>
  );
}
