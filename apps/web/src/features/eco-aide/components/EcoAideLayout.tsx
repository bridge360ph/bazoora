"use client";

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Truck, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { ecoAideNavItems } from "../../../routes/navigation";

export default function EcoAideLayout() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const navigate = useNavigate();

  const isSettingsPage = location.pathname.startsWith("/eco-aide/settings");
  const isCollectionsPage = location.pathname.startsWith("/eco-aide/collections");
  const isSubpage = isSettingsPage || isCollectionsPage;
  const isRoutePage =
    location.pathname === "/eco-aide/route" ||
    location.pathname === "/eco-aide";

  const userInitials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "BE";

  // RETRIEVE CURRENT VIEW LABEL BASED ON ACTIVE ROUTE PATH
  const activeLabel = isSettingsPage
    ? "Settings"
    : ecoAideNavItems.find((item) => {
        if (item.end) return location.pathname === item.to;
        return location.pathname.startsWith(item.to);
      })?.label || "Route";

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden font-['Inter',sans-serif] bg-[#f0f3f6] text-slate-900">
      {/* NATIVE APP TOP BAR */}
      <header className="relative h-14 bg-[#0a1811] border-b border-emerald-950/60 px-4 flex items-center justify-between shrink-0 text-white z-20 shadow-sm">
        {/* LEFT CONTROL: SWITCHES TO BACK NAVIGATION ON SUBPAGES */}
        {isSubpage ? (
          <button
            type="button"
            onClick={() => navigate("/eco-aide/route")}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Back to Route"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Back</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <Truck className="w-4 h-4" />
            </div>
            <span className="font-black text-sm tracking-wider text-white">
              BAZOORA
            </span>
          </div>
        )}

        {/* ACTIVE SCREEN TITLE */}
        <h2 className="text-xs font-black tracking-widest uppercase text-gray-200 absolute left-1/2 -translate-x-1/2 pointer-events-none">
          {activeLabel}
        </h2>

        {/* PROFILE AVATAR: DIRECT NAVIGATION TO SETTINGS */}
        <button
          type="button"
          onClick={() => {
            if (!isSettingsPage) {
              navigate("/eco-aide/settings");
            }
          }}
          className={`relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-[#0a1811] text-xs font-black ring-2 ring-emerald-400/30 active:scale-95 transition-transform cursor-pointer ${
            isSettingsPage ? "ring-white/40 opacity-80 cursor-default" : ""
          }`}
          aria-label="Account Settings"
        >
          {userInitials}
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-300 ring-2 ring-[#0a1811]" />
        </button>
      </header>

      {/* PRIMARY VIEWPORT: FULL HEIGHT ON ROUTE, COMFORTABLE SCROLLING ON SUBPAGES */}
      <main
        className={`flex-1 relative flex flex-col ${
          isRoutePage ? "overflow-hidden pb-0" : "overflow-y-auto pb-6"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}