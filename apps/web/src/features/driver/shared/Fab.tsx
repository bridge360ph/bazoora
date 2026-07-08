import { useState } from "react";
import { Icon } from "./icons";
import { icons } from "./iconData";

// FAB (mobile) — Messages + Profile live here instead of crowding the
// bottom nav or the header. Sits bottom-LEFT so it never covers the
// right-aligned status pill / details content on pages below it.
export function Fab({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const [fabOpen, setFabOpen] = useState(false);

  const go = (key: string) => {
    onNavigate?.(key);
    setFabOpen(false);
  };

  return (
    <div className="fixed left-[18px] bottom-[84px] z-[25] flex flex-col items-start">
      {fabOpen && (
        <div className="flex flex-col items-start gap-2.5 mb-3">
          <button
            className="flex items-center gap-2 bg-white text-[#0f2a1f] border border-gray-200 rounded-full px-4 py-2.5 text-[13px] font-bold shadow-[0_6px_16px_rgba(0,0,0,0.14)] cursor-pointer whitespace-nowrap"
            onClick={() => go("profile")}
          >
            <Icon icon={icons.profile} size={16} />
            <span>Profile</span>
          </button>
          <button
            className="flex items-center gap-2 bg-white text-[#0f2a1f] border border-gray-200 rounded-full px-4 py-2.5 text-[13px] font-bold shadow-[0_6px_16px_rgba(0,0,0,0.14)] cursor-pointer whitespace-nowrap"
            onClick={() => go("messages")}
          >
            <Icon icon={icons.messages} size={16} />
            <span>Messages</span>
          </button>
        </div>
      )}

      <button
        className="w-14 h-14 rounded-[18px] bg-[#0f2a1f] text-white border-none flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.28)] cursor-pointer"
        onClick={() => setFabOpen((v) => !v)}
        aria-label="Quick actions"
      >
        <Icon icon={fabOpen ? icons.close : icons.messages} size={22} />
      </button>
    </div>
  );
}
