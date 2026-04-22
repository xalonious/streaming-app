import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, CheckIcon } from "./Icons";

export function SeasonDropdown({
  seasons,
  value,
  onChange,
}: {
  seasons: Array<{ id?: number; season_number: number; name?: string }>;
  value: number;
  onChange: (seasonNumber: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => {
    const found = seasons.find((s) => s.season_number === value);
    return found?.name ?? `Season ${value}`;
  }, [seasons, value]);

  const updatePos = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ left: r.left, top: r.bottom + 6 });
  };

  useLayoutEffect(() => {
    updatePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (listRef.current?.parentElement?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    const active = el.querySelector(`[data-season="${value}"]`) as HTMLElement | null;
    if (active) el.scrollTop = Math.max(0, active.offsetTop - el.clientHeight / 2 + active.offsetHeight / 2);
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
          <div ref={listRef}>
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
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}