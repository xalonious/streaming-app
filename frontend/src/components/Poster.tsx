export function Poster({
  src,
  title,
  className = "",
}: {
  src: string | null;
  title: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={[
          "flex aspect-[2/3] items-center justify-center rounded-xl bg-white/[0.04] text-xs text-zinc-500",
          className,
        ].join(" ")}
      >
        No poster
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      className={["aspect-[2/3] w-full rounded-xl object-cover", className].join(" ")}
    />
  );
}
