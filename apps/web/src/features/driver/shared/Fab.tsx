import { Icon } from "./icons";
import { icons } from "./iconData";

// FAB (mobile) — used to hold Profile + Messages, but Profile now lives on
// the header avatar instead (tap it to go to Settings), so this is just a
// single-tap shortcut straight to Messages — no expand/collapse menu needed
// anymore since there's only one destination.
export function Fab({ onNavigate }: { onNavigate?: (key: string) => void }) {
  return (
    <button
      className="fixed left-[18px] bottom-[84px] z-[25] w-14 h-14 rounded-[18px] bg-[#0f2a1f] text-white border-none flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.28)] cursor-pointer"
      onClick={() => onNavigate?.("messages")}
      aria-label="Messages"
    >
      <Icon icon={icons.messages} size={22} />
    </button>
  );
}