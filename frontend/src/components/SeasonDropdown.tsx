import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

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
    setPos({
      left: r.left,
      top: r.bottom + 10,
      width: r.width,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onResize = () => updatePos();
    const onScroll = () => updatePos();

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const w = wrapRef.current;
      const menu = listRef.current?.parentElement?.parentElement;
      const t = e.target as Node;

      const insideButton = !!w && w.contains(t);
      const insideMenu = !!menu && menu.contains(t);

      if (!insideButton && !insideMenu) setOpen(false);
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
    if (active) {
      const top = active.offsetTop;
      const height = active.offsetHeight;
      el.scrollTop = Math.max(0, top - el.clientHeight / 2 + height / 2);
    }
  }, [open, value]);

  const menu =
    open && pos
      ? createPortal(
          <div
            className="fixed z-[9999]"
            style={{
              left: pos.left,
              top: pos.top,
              width: Math.min(420, Math.max(pos.width, 260)),
            }}
          >
            <div className="rounded-2xl border border-white/12 bg-black/70 backdrop-blur-xl shadow-[0_30px_90px_rgba(0,0,0,0.75)] overflow-hidden">
              <div className="px-3.5 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/55">
                    Seasons
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10"
                  >
                    Esc
                  </button>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div ref={listRef} role="listbox" className="max-h-[320px] overflow-auto p-2">
                {seasons.map((s) => {
                  const n = s.season_number;
                  const name = s.name ?? `Season ${n}`;
                  const active = n === value;

                  return (
                    <button
                      key={s.id ?? n}
                      type="button"
                      role="option"
                      aria-selected={active}
                      data-season={n}
                      onClick={() => {
                        onChange(n);
                        setOpen(false);
                      }}
                      className={[
                        "group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/80 hover:bg-white/7 hover:text-white",
                      ].join(" ")}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={[
                            "inline-flex h-7 w-7 items-center justify-center rounded-lg border text-[11px] font-semibold",
                            active
                              ? "border-white/20 bg-white/10 text-white"
                              : "border-white/10 bg-black/30 text-white/70 group-hover:border-white/15 group-hover:text-white/85",
                          ].join(" ")}
                        >
                          {String(n).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 truncate font-semibold">{name}</span>
                      </span>

                      {active ? (
                        <span className="text-white/85">✓</span>
                      ) : (
                        <span className="text-white/35 group-hover:text-white/55">→</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="h-px bg-white/10" />

              <div className="px-3.5 py-2.5 text-[11px] text-white/45">
                Tip: click outside to close.
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "group relative inline-flex w-[220px] items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-sm",
          "border border-white/10 bg-black/35 text-white/90 backdrop-blur outline-none",
          "hover:border-white/20 hover:bg-black/45",
          "focus-visible:ring-2 focus-visible:ring-white/15",
          open ? "border-white/25 bg-black/55" : "",
        ].join(" ")}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white/25 shadow-[0_0_18px_rgba(255,255,255,0.18)] group-hover:bg-white/35" />
          <span className="min-w-0 truncate font-semibold">{selected}</span>
        </span>

        <span
          className={[
            "text-white/55 transition group-hover:text-white/70",
            open ? "rotate-180" : "",
          ].join(" ")}
        >
          ▾
        </span>

        <span className="pointer-events-none absolute inset-0 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_50px_rgba(0,0,0,0.55)]" />
      </button>

      {menu}
    </div>
  );
}
