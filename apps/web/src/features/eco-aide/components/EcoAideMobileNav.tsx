"use client";

import { NavLink } from "react-router-dom";
import { MapPin, Archive, Bell } from "lucide-react";

interface EcoAideMobileNavProps {
  onOpenNotifications?: () => void;
  unreadCount?: number;
}

export default function EcoAideMobileNav({
  onOpenNotifications,
  unreadCount = 0,
}: EcoAideMobileNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 h-20 bg-[#0a1811] border-t border-emerald-950/60 flex items-center justify-around px-4 pt-1.5 pb-2.5 z-40 md:hidden shadow-lg">
      {/* ROUTE TAB */}
      <NavLink
        to="/eco-aide/route"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-20 h-full gap-1.5 transition-colors ${
            isActive ? "text-emerald-400 font-bold" : "text-gray-400 hover:text-gray-200"
          }`
        }
      >
        <MapPin className="w-5 h-5" />
        <span className="text-[11px] font-bold tracking-tight">Route</span>
      </NavLink>

      {/* COLLECTIONS TAB */}
      <NavLink
        to="/eco-aide/collections"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-20 h-full gap-1.5 transition-colors ${
            isActive ? "text-emerald-400 font-bold" : "text-gray-400 hover:text-gray-200"
          }`
        }
      >
        <Archive className="w-5 h-5" />
        <span className="text-[11px] font-bold tracking-tight">Collections</span>
      </NavLink>

      {/* ALERTS TAB WITH AMPLE HEADROOM */}
      <button
        type="button"
        onClick={onOpenNotifications}
        className="relative flex flex-col items-center justify-center w-20 h-full gap-1.5 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
        aria-label="Open alerts"
      >
        <div className="relative flex items-center justify-center">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-500 text-[#0a1811] text-[9px] font-black ring-2 ring-[#0a1811]">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-[11px] font-bold tracking-tight">Alerts</span>
      </button>
    </nav>
  );
}