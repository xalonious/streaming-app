"use client";

import { useId, useRef } from "react";
import type { Provider } from "../../lib/providers/types";
import { SettingsIcon } from "./Icons";

export function PlayerSourcePicker({ providers, selectedId, loading, onSelect }: {
  providers: Provider[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
}) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={trigger} popoverTarget={id} aria-label="Change streaming source" aria-haspopup="dialog" title="Change source"
        className="absolute right-6 top-5 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-zinc-300 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white focus-visible:outline-2 focus-visible:outline-white/60">
        <SettingsIcon size={18} />
      </button>
      <div ref={panel} id={id} popover="auto" role="dialog" aria-label="Streaming source"
        className="player-source-picker fixed inset-auto right-6 top-16 m-0 w-56 max-w-[calc(100vw_-_3rem)] rounded-xl border border-white/10 bg-[#161616]/95 p-3 text-white shadow-2xl backdrop-blur-md">
        <label htmlFor={`${id}-source`} className="mb-2 block text-xs font-medium text-zinc-400">Playback source</label>
        <select id={`${id}-source`} aria-label="Streaming source" value={selectedId ?? ""} disabled={loading || !providers.length}
          className="w-full rounded-lg border border-white/10 bg-zinc-900 px-2 py-2 text-sm text-white outline-none focus:border-white/30 disabled:text-zinc-500"
          onChange={e => {
            onSelect(e.target.value);
            panel.current?.hidePopover();
            trigger.current?.focus();
          }}>
          {!providers.length && <option value="">{loading ? "Loading…" : "No sources available"}</option>}
          {providers.map(provider => <option value={provider.id} key={provider.id}>{provider.name}</option>)}
        </select>
      </div>
    </>
  );
}
