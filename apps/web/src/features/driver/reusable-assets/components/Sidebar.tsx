import { Icon, icons } from "../assets/icons";
import { navItems } from "../assets/navConfig";
import {
  logo,
  navItem,
  navItemActive,
  sidebarBottom,
  avatar,
  drawerBackdrop,
  drawerPanel,
} from "../assets/layoutStyles";

/* ---------------- NAV LIST (desktop sidebar links) ---------------- */
export function NavList({
  activeKey,
  onNavigate,
}: {
  activeKey: string;
  onNavigate?: (key: string) => void;
}) {
  return (
    <div style={{ marginTop: 18 }}>
      {navItems.map((item) => (
        <div
          key={item.key}
          style={item.key === activeKey ? navItemActive : navItem}
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
      <div style={drawerBackdrop} onClick={onClose} />
      <aside style={drawerPanel}>
        <div>
          <div style={logo}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>🚛 BAZOORA</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>DRIVER</div>
          </div>
          <NavList activeKey={activeKey} onNavigate={onNavigate} />
        </div>

        <div style={sidebarBottom}>
          <div style={avatar}>{userInitials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>{userName}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>{userUnit}</div>
          </div>
          <div style={{ opacity: 0.7, cursor: "pointer" }}>
            <Icon icon={icons.settings} />
          </div>
        </div>
      </aside>
    </>
  );
}
