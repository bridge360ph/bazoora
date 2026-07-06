import { useState } from "react";
import { Icon, icons } from "../assets/icons";
import {
  fabWrap,
  fabActions,
  fabActionBtn,
  fabMain,
} from "../assets/layoutStyles";

// FAB (mobile) — Messages + Profile live here instead of crowding the
// bottom nav or the header. Sits bottom-LEFT so it never covers the
// right-aligned status pill / details content on pages below it.
export function Fab({
  onNavigate,
}: {
  onNavigate?: (key: string) => void;
}) {
  const [fabOpen, setFabOpen] = useState(false);

  const go = (key: string) => {
    onNavigate?.(key);
    setFabOpen(false);
  };

  return (
    <div style={fabWrap}>
      {fabOpen && (
        <div style={fabActions}>
          <button
            style={fabActionBtn}
            onClick={() => go("profile")}
          >
            <Icon icon={icons.profile} size={16} />
            <span>Profile</span>
          </button>

          <button
            style={fabActionBtn}
            onClick={() => go("messages")}
          >
            <Icon icon={icons.messages} size={16} />
            <span>Messages</span>
          </button>
        </div>
      )}

      <button
        style={fabMain}
        onClick={() => setFabOpen((v) => !v)}
        aria-label="Quick actions"
      >
        <Icon
          icon={fabOpen ? icons.close : icons.messages}
          size={22}
        />
      </button>
    </div>
  );
}