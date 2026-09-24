import { NavLink } from "react-router-dom";
import {
  MapPin,
  Archive,
  ClipboardList,
  Bell,
  Settings,
} from "lucide-react";

interface EcoAideMobileNavProps {
  onOpenNotifications?: () => void;
  unreadCount?: number;
}

export default function EcoAideMobileNav({
  onOpenNotifications,
  unreadCount = 0,
}: EcoAideMobileNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 h-16 bg-[#0a1811] border-t border-white/10 flex items-center justify-around px-2 z-40 md:hidden">
      {/* ROUTE TAB */}
      <NavLink
        to="/eco-aide/route"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            isActive ? "text-emerald-400 font-bold" : "text-gray-400 hover:text-gray-200"
          }`
        }
      >
        <MapPin className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Route</span>
      </NavLink>

      {/* COLLECTIONS TAB */}
      <NavLink
        to="/eco-aide/collections"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            isActive ? "text-emerald-400 font-bold" : "text-gray-400 hover:text-gray-200"
          }`
        }
      >
        <Archive className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Collections</span>
      </NavLink>

      {/* TASKS TAB */}
      <NavLink
        to="/eco-aide/tasks"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            isActive ? "text-emerald-400 font-bold" : "text-gray-400 hover:text-gray-200"
          }`
        }
      >
        <ClipboardList className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Tasks</span>
      </NavLink>

      {/* NOTIFICATIONS TAB TRIGGER */}
      {onOpenNotifications ? (
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative flex flex-col items-center justify-center w-full h-full gap-1 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          aria-label="Open notifications"
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#0a1811]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Alerts</span>
        </button>
      ) : (
        <NavLink
          to="/eco-aide/notifications"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive ? "text-emerald-400 font-bold" : "text-gray-400 hover:text-gray-200"
            }`
          }
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#0a1811]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Alerts</span>
        </NavLink>
      )}

      {/* SETTINGS TAB */}
      <NavLink
        to="/eco-aide/settings"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            isActive ? "text-emerald-400 font-bold" : "text-gray-400 hover:text-gray-200"
          }`
        }
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Settings</span>
      </NavLink>
    </nav>
  );
}