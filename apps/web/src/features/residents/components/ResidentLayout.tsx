"use client";

import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  MapPin,
  Truck,
  Calendar,
  FileText,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { residentNavItems } from "../../../routes/navigation";

export default function ResidentLayout() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clear);
  const location = useLocation();

  const userInitials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "JD";

  const userFullName = user
    ? `${user.firstName} ${user.lastName}`
    : "Juan Dela Cruz";

  // Helper to map route labels to icons
  const getIcon = (label: string) => {
    switch (label) {
      case "Dashboard":
        return LayoutGrid;
      case "Track Truck":
        return MapPin;
      case "Hauling Requests":
        return Truck;
      case "Schedule":
        return Calendar;
      case "Reports":
        return FileText;
      case "Notifications":
        return Bell;
      case "Settings":
        return Settings;
      default:
        return LayoutGrid;
    }
  };

  // Get active route label for display
  const activeLabel = residentNavItems.find(item => {
    if (item.end) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  })?.label || "Portal";

  return (
    <div className="flex h-full w-full overflow-hidden font-sans bg-gray-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a1811] flex flex-col shrink-0 text-gray-300">
        {/* Brand */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-emerald-500 text-xl font-black">▣</span>
            <div>
              <div className="font-black text-white text-base tracking-wider leading-none">
                BAZOORA
              </div>
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                CITIZEN PORTAL
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1">
          {residentNavItems.map((item) => {
            const Icon = getIcon(item.label);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 w-full px-6 py-3 text-sm font-semibold transition-all border-l-[3px] ${
                    isActive
                      ? "bg-white/5 text-white border-emerald-500 font-bold"
                      : "text-gray-400 hover:text-gray-200 border-transparent hover:bg-white/[0.02]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? "text-emerald-500" : "text-gray-400"}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Profile Footer */}
        <div className="p-4 border-t border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center font-black text-sm text-[#0a1811] shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-bold truncate">{userFullName}</div>
            <div className="text-[10px] text-gray-555 truncate">Resident</div>
          </div>
          <NavLink
            to="/resident/settings"
            className="text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </NavLink>
          <button
            onClick={() => clearSession()}
            className="text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-8 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">
            {activeLabel}
          </h2>
          <div className="flex items-center gap-4">
            <NavLink
              to="/resident/notifications"
              className="relative p-2 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-gray-700 dark:hover:bg-slate-800 dark:text-gray-400 dark:hover:text-white cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </NavLink>
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-gray-700 dark:text-gray-300">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Content Panel */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
