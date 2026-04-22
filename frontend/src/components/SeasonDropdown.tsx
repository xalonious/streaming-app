import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, CheckIcon } from "./Icons";
import { useDropdown } from "../hooks/useDropdown";

export function SeasonDropdown({
  seasons,
  value,
  onChange,
}: {
  seasons: Array<{ id?: number; season_number: number; name?: string }>;
  value: number;
  onChange: (seasonNumber: number) => void;
}) {
  const { open, setOpen, pos, btnRef, wrapRef, listRef } = useDropdown();

  const selected = useMemo(() => {
    const found = seasons.find((s) => s.season_number === value);
    return found?.name ?? `Season ${value}`;
  }, [seasons, value]);

  useEffect(() => {
    if (!open) return;
    const container = listRef.current;
    if (!container) return;
    const active = container.querySelector(`[data-season="${value}"]`) as HTMLElement | null;
    if (active) container.scrollTop = Math.max(0, active.offsetTop - container.clientHeight / 2 + active.offsetHeight / 2);
  }, [open, value]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-semibold transition-colors"
      >
        {selected}
        <span style={{ display: "inline-flex", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
          <ChevronDown size={14} />
        </span>
      </button>

      {pos && createPortal(
        <div
          ref={listRef}
          className="fixed rounded-xl overflow-hidden border border-white/[0.12] bg-[#1e1e1e]"
          style={{
            top: pos.top, left: pos.left,
            zIndex: 99999, minWidth: 200, maxHeight: 320, overflowY: "auto",
            boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0) scale(1)" : "translateY(-6px) scale(0.97)",
            pointerEvents: open ? "auto" : "none",
            transition: "opacity 0.18s ease, transform 0.18s ease",
            scrollbarWidth: "thin",
            scrollbarColor: "#333 transparent",
          }}
        >
          {seasons.map(s => {
            const n = s.season_number;
            const name = s.name ?? `Season ${n}`;
            const active = n === value;
            return (
              <button
                key={s.id ?? n}
                type="button"
                data-season={n}
                onClick={() => { onChange(n); setOpen(false); }}
                className={`flex items-center justify-between w-full px-4 py-2.5 text-sm border-none cursor-pointer text-left transition-colors border-b border-white/[0.05] last:border-0 ${
                  active ? "bg-white/[0.08] text-white" : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {name}
                {active && <CheckIcon />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
