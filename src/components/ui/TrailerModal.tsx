import { CloseIcon } from "./Icons";

type Props = {
  url: string;
  name: string | undefined;
  onClose: () => void;
};

export function TrailerModal({ url, name, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-zinc-300 truncate">{name ?? "Trailer"}</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full border border-white/15 text-zinc-400 hover:text-white transition ml-3"
          >
            <CloseIcon size={14} />
          </button>
        </div>
        <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
          <iframe src={url} title={name ?? "Trailer"} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
