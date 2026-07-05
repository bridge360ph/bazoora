import React from "react";
import Logo from "../../../components/assets/logo.svg";

// ---------------------------------------------------------------------------
// AdminSidebar.tsx — sidebar for the admin user role only
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface AdminSidebarProps {
  activePath: string;
  onNavigate: (path: string) => void;
  user: {
    name: string;
    unitId: string;
    avatarInitials: string;
  };
  onSettingsClick: () => void;
}

// ---------------------------------------------------------------------------
// Admin nav items — hardcoded for this role
// ---------------------------------------------------------------------------

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Eco-Aide Management",
    path: "/admin/eco-aides",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    label: "Fleet Management",
    path: "/admin/fleet",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="7" width="13" height="11" rx="1" />
        <path d="M14 10h4l3 4v4h-7V10z" />
        <circle cx="5.5" cy="18.5" r="1.5" />
        <circle cx="18.5" cy="18.5" r="1.5" />
      </svg>
    ),
  },
  {
    label: "Route Management",
    path: "/admin/routes",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h4a4 4 0 0 1 4 4v2a4 4 0 0 0 4 4h6" />
        <path d="M18 4l3 3-3 3" />
        <path d="M3 17h4" />
        <path d="M4 14l-3 3 3 3" />
      </svg>
    ),
  },
  {
    label: "Hauling Request Management",
    path: "/admin/hauling-requests",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 3v2h6V3" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    path: "/admin/analytics",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="20" x2="4" y2="10" />
        <line x1="9" y1="20" x2="9" y2="4" />
        <line x1="14" y1="20" x2="14" y2="14" />
        <line x1="19" y1="20" x2="19" y2="8" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
  {
    label: "Notifications",
    path: "/admin/notifications",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: "Settings and System Configuration",
    path: "/admin/settings",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AdminSidebar — navigation sidebar for the admin user role.
 *
 * Nav items are hardcoded to admin routes. For other roles, create a
 * separate sidebar component (e.g. EcoAideSidebar, CollectorSidebar).
 *
 * Usage:
 *   <AdminSidebar
 *     activePath="/admin/dashboard"
 *     onNavigate={(path) => navigate(path)}
 *     user={{ name: "John Doe", unitId: "Unit #4029", avatarInitials: "JD" }}
 *     onSettingsClick={() => navigate("/admin/settings")}
 *   />
 */
const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activePath,
  onNavigate,
  user,
  onSettingsClick,
}) => (
  <aside className="flex flex-col w-[200px] min-w-[200px] h-screen bg-[#072217] border-r border-[#0f2417]">
    {/* Logo */}
    <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[#0f2417]">
        <img src={Logo} alt="Logo" className="w-8 h-8" />
      <div>
        <p className="text-white font-bold text-2xl leading-tight tracking-wide">
          BAZOORA
        </p>
        <p className="text-white text-[10px] leading-tight">HAULING ADMIN</p>
      </div>
    </div>

    {/* Nav */}
    <nav className="flex-1 overflow-y-auto py-3">
      {NAV_ITEMS.map((item) => {
        const isActive = activePath === item.path;
        return (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`
              w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors
              ${isActive
                ? "bg-[#2a5c38] text-white"
                : "text-green-200 hover:bg-[#224a2d] hover:text-white"
              }
            `}
          >
            <span className={isActive ? "text-white" : "text-green-300"}>
              {item.icon}
            </span>
            <span className="leading-snug">{item.label}</span>
          </button>
        );
      })}
    </nav>

    {/* User footer */}
    <div className="flex items-center gap-2.5 px-3 py-3 border-t border-[#0f2417]">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#4a9e5c] text-white text-xs font-semibold shrink-0">
        {user.avatarInitials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-medium truncate">{user.name}</p>
        <p className="text-white text-[10px] truncate">{user.unitId}</p>
      </div>
      <button
        onClick={onSettingsClick}
        className="text-green-300 hover:text-white transition-colors shrink-0"
        aria-label="Settings"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>
  </aside>
);

export default AdminSidebar;
