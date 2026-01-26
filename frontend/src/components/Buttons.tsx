import React from "react";
import { Link } from "react-router-dom";

export function PrimaryLinkButton({
  children,
  to,
  className = "",
}: {
  children: React.ReactNode;
  to: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:opacity-90",
        className,
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export function SecondaryButton({
  children,
  onClick,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm font-semibold text-white/90 backdrop-blur hover:bg-black/45",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
