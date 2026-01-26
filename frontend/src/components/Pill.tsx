import React from "react";

export function Pill({
  active,
  children,
  onClick,
  className = "",
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1.5 text-xs transition",
        active
          ? "bg-white/10 text-zinc-100 ring-1 ring-white/15"
          : "bg-zinc-950/40 text-zinc-300 ring-1 ring-white/10 hover:bg-white/10 hover:text-zinc-100",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
