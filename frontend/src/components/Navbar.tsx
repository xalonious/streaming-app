export function Navbar({ onSearchOpen }: { onSearchOpen: () => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 py-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#e50914]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">Streaming</span>
      </div>

      <button
        onClick={onSearchOpen}
        className="pointer-events-auto w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white transition-colors duration-200"
        aria-label="Search"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      </button>
    </nav>
  );
}