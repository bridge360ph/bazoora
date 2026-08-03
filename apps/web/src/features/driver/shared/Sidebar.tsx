import { Icon } from "./icons";
import { icons } from "./iconData";
import { navItems } from "./navConfig";

/* ---------------- NAV LIST (desktop sidebar links) ---------------- */
export function NavList({
  activeKey,
  onNavigate,
}: {
  activeKey: string;
  onNavigate?: (key: string) => void;
}) {
  return (
    <div className="mt-[18px]">
      {navItems.map((item) => (
        <div
          key={item.key}
          className={
            item.key === activeKey
              ? "flex items-center gap-2.5 px-2 py-2.5 text-[13px] rounded-[10px] cursor-pointer font-bold bg-white/10"
              : "flex items-center gap-2.5 px-2 py-2.5 text-[13px] rounded-[10px] cursor-pointer opacity-65"
          }
          onClick={() => onNavigate?.(item.key)}
        >
          <Icon icon={item.icon} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- SIDEBAR DRAWER ---------------- */
export function Sidebar({
  activeKey,
  isMobile,
  navOpen,
  userName = "John Doe",
  userUnit = "Unit #4029",
  userInitials = "JD",
  onNavigate,
  onClose,
}: {
  activeKey: string;
  isMobile: boolean;
  navOpen: boolean;
  userName?: string;
  userUnit?: string;
  userInitials?: string;
  onNavigate?: (key: string) => void;
  onClose?: () => void;
}) {
  // Sidebar drawer is desktop-only — mobile relies entirely on the bottom
  // nav + FAB, no hamburger/drawer at all.
  if (isMobile || !navOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-30" onClick={onClose} />
      <aside className="fixed top-0 left-0 bottom-0 w-[230px] bg-[#0f2a1f] text-white p-3.5 z-[31] flex flex-col justify-between">
        <div>
          <div className="mb-2.5">
            <div className="font-extrabold text-lg">🚛 BAZOORA</div>
            <div className="text-[10px] opacity-60">DRIVER</div>
          </div>
          <NavList activeKey={activeKey} onNavigate={onNavigate} />
        </div>

        <div className="flex items-center gap-2.5 pt-3.5 border-t border-white/10">
          <div className="w-[34px] h-[34px] rounded-full bg-[#e0983f] text-white flex items-center justify-center font-bold text-[13px] flex-shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[13px] text-white">{userName}</div>
            <div className="text-[11px] opacity-60">{userUnit}</div>
          </div>
          <div className="opacity-70 cursor-pointer" onClick={() => onNavigate?.("settings")} title="Settings">
            <Icon icon={icons.settings} />
          </div>
        </div>
      </aside>
    </>
  );
}