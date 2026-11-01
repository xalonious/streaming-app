import { SearchIcon } from "../ui/Icons";
import { Brand } from "./Brand";

export function Navbar({ onSearchOpen }: { onSearchOpen: () => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 py-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
      <Brand className="pointer-events-auto" />
      <button
        onClick={onSearchOpen}
        className="pointer-events-auto w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white transition-colors duration-200"
        aria-label="Search"
      >
<SearchIcon size={20} />
      </button>
    </nav>
  );
}
