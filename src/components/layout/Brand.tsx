import { PlayIcon } from "../ui/Icons";

type BrandProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
};

export function Brand({
  className = "",
  markClassName = "",
  wordmarkClassName = "",
}: BrandProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full bg-[#e50914] ${markClassName}`}
      >
        <PlayIcon size={14} />
      </div>
      <span
        className={`text-lg font-bold tracking-tight text-white ${wordmarkClassName}`}
      >
        Streaming
      </span>
    </div>
  );
}
