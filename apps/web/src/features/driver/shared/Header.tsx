import { useState } from "react";
import { Icon, HamburgerIcon } from "./icons";
import { icons } from "./iconData";

export type SettingsTab = "account" | "notifications" | "system";

const menuItems: { tab: SettingsTab; label: string; icon: string }[] = [
  { tab: "account", label: "Account", icon: "profile" },
  { tab: "notifications", label: "Notifications", icon: "bell" },
  { tab: "system", label: "System", icon: "settings" },
];

export function Header({
  isMobile,
  title,
  mobileTitle = "BAZOORA",
  userInitials = "JD",
  onToggleNav,
  onSelectSettingsTab,
  onLogout,
}: {
  isMobile: boolean;
  title: string;
  mobileTitle?: string;
  userInitials?: string;
  onToggleNav?: () => void;
  onSelectSettingsTab?: (tab: SettingsTab) => void;
  onLogout?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-[60px] bg-[#0f2a1f] text-white flex items-center justify-between px-[18px] flex-shrink-0 relative">
      <div className="flex-1 flex items-center cursor-pointer" onClick={() => !isMobile && onToggleNav?.()}>
        {!isMobile && <HamburgerIcon />}
      </div>

      <div className="flex-1 text-center font-extrabold">{isMobile ? mobileTitle : title}</div>

      <div className="flex-1 flex items-center justify-end gap-3">
        <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center bg-white/10">
          <Icon icon={icons.bell} />
        </div>

        {/* Avatar opens a dropdown: jump straight to a specific Settings
            tab, or log out. Stays visible on mobile too. */}
        <div className="relative">
          <div
            className="w-[34px] h-[34px] rounded-full bg-[#e0983f] text-white flex items-center justify-center font-bold text-[13px] flex-shrink-0 cursor-pointer"
            onClick={() => setMenuOpen((v) => !v)}
            title="Account menu"
          >
            {userInitials}
          </div>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              {/* Fixed (not absolute) so it's anchored to the viewport, not
                  to the tiny avatar wrapper — this keeps it from being
                  clipped by mainWrap's overflow on shorter mobile
                  viewports, which was silently hiding/disabling every
                  item below whatever fit. */}
              <div className="fixed right-[18px] top-[64px] bg-white text-slate-900 rounded-xl border border-gray-200 shadow-lg py-1.5 w-44 z-50">
                {menuItems.map((item) => (
                  <button
                    key={item.tab}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold hover:bg-gray-50 text-left"
                    onClick={() => {
                      setMenuOpen(false);
                      onSelectSettingsTab?.(item.tab);
                    }}
                  >
                    <Icon icon={icons[item.icon]} size={16} />
                    {item.label}
                  </button>
                ))}

                <div className="my-1 border-t border-gray-100" />

                <button
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 text-left"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout?.();
                  }}
                >
                  <Icon icon={icons.logout} size={16} />
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}