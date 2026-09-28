"use client";

import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  MapPin,
  ClipboardList,
  Settings,
  LogOut,
  Bell,
  Archive,
  AlertOctagon,
  MessageSquare,
  Truck,
  Menu,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { ecoAideNavItems } from "../../../routes/navigation";
import EcoAideMobileNav from "./EcoAideMobileNav";
import { toast } from "sonner";

export default function EcoAideLayout() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clear);
  const location = useLocation();

  const userInitials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "BE";

  const userFullName = user
    ? `${user.firstName} ${user.lastName}`
    : "Brian Eco-Aide";

  // MAP ROUTE LABELS TO FIGMA WIREFRAME ICONS
  const getIcon = (label: string) => {
    switch (label) {
      case "Dashboard":
        return LayoutGrid;
      case "Route":
      case "Hauling Route":
        return MapPin;
      case "Collections":
        return Archive;
      case "Assigned Tasks":
        return ClipboardList;
      case "Report Issue":
        return AlertOctagon;
      case "Messages":
        return MessageSquare;
      case "Settings":
        return Settings;
      default:
        return LayoutGrid;
    }
  };

  // GET ACTIVE ROUTE LABEL FOR TOP HEADER DISPLAY
  const activeLabel =
    ecoAideNavItems.find((item) => {
      if (item.end) return location.pathname === item.to;
      return location.pathname.startsWith(item.to);
    })?.label || "Route";

  return (
    <div className="flex h-full w-full overflow-hidden font-['Inter',sans-serif] bg-[#f4f6f8] text-slate-800">
      {/* DESKTOP SIDEBAR MATCHING FIGMA */}
      <aside className="hidden md:flex w-64 bg-[#0a1811] flex-col shrink-0 text-gray-300">
        {/* BRAND HEADER */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-white text-base tracking-wider leading-none">
                BAZOORA
              </div>
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                ECO-AIDE
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION LIST */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-3">
          {ecoAideNavItems.map((item) => {
            const Icon = getIcon(item.label);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={(e) => {
                  // PREVENT UNMERGED ROUTES FROM THROWING 404 DURING DEMO
                  if (item.to !== "/eco-aide/route") {
                    e.preventDefault();
                    toast.info(`${item.label} module is queued in PR review.`);
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 w-full px-4 py-3 text-xs font-bold rounded-xl transition-all ${
                    isActive
                      ? "bg-white/10 text-white font-extrabold shadow-sm"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-emerald-400" : "text-gray-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* PROFILE FOOTER */}
        <div className="p-4 border-t border-white/5 flex items-center gap-3 bg-[#07130d]">
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center font-black text-xs text-[#0a1811] shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-bold truncate">
              {userFullName}
            </div>
            <div className="text-[10px] text-gray-400 truncate">Unit #4029</div>
          </div>
          <NavLink
            to="/eco-aide/settings"
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </NavLink>
          <button
            type="button"
            onClick={() => clearSession()}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP HEADER: CONTINUOUS DARK FIGMA STYLE WITH HAMBURGER & CENTERED TITLE */}
        <header className="relative h-16 bg-[#0a1811] border-b border-white/10 px-4 md:px-8 flex items-center justify-between shrink-0 text-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info("Navigation drawer")}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-sm font-bold text-white tracking-wider absolute left-1/2 -translate-x-1/2 pointer-events-none">
            {activeLabel}
          </h2>

          <div className="flex items-center gap-3">
            {/* THICKENED NOTIFICATION BELL ICON */}
            <button
              type="button"
              onClick={() => toast.info("No unread alerts.")}
              className="relative p-2 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 stroke-[2.25]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-[#0a1811] flex items-center justify-center text-xs font-black">
              {userInitials}
            </div>
          </div>
        </header>

        {/* SCROLLABLE OUTLET CONTAINER */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col pb-16 md:pb-0">
          <Outlet />
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <EcoAideMobileNav />
    </div>
  );
}