export function MediaTypeToggle<T extends string>({ value, options, onChange }: {
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-white/[0.06] rounded-xl border border-white/10">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition ${value === opt.value ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
