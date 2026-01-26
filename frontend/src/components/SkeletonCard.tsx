export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] p-2">
      <div className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.05]" />
      <div className="mt-3 space-y-2 px-1 pb-2">
        <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.05]" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.05]" />
      </div>
    </div>
  );
}
