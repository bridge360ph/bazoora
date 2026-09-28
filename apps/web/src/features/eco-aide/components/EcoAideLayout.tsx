"use client";

import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Truck, ArrowLeft, Bell, X } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { ecoAideNavItems } from "../../../routes/navigation";
import EcoAideMobileNav from "./EcoAideMobileNav";

interface DispatchAlert {
  id: string;
  title: string;
  message: string;
  time: string;
  priority: "high" | "normal";
  read: boolean;
}

export default function EcoAideLayout() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const navigate = useNavigate();

  const isSettingsPage = location.pathname.startsWith("/eco-aide/settings");

  // MOCK DISPATCH ALERTS MATCHING PROPOSAL 2 SAMPLES
  const [alertsList, setAlertsList] = useState<DispatchAlert[]>([
    {
      id: "alert-001",
      title: "Alley Obstruction on Mendoza St",
      message: "Utility repairs blocking heavy vehicle lane. Use alternate pass.",
      time: "2 mins ago",
      priority: "high",
      read: false,
    },
    {
      id: "alert-002",
      title: "Reroute Advisory: San Agustin",
      message: "Secondary market area cleared for waste collection.",
      time: "15 mins ago",
      priority: "normal",
      read: false,
    },
  ]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const unreadCount = alertsList.filter((a) => !a.read).length;

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

  const handleDismissAlerts = () => {
    setAlertsList((prev) => prev.map((a) => ({ ...a, read: true })));
    setIsAlertsOpen(false);
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden font-['Inter',sans-serif] bg-[#f0f3f6] text-slate-900">
      {/* NATIVE APP TOP BAR */}
      <header className="relative h-14 bg-[#0a1811] border-b border-emerald-950/60 px-4 flex items-center justify-between shrink-0 text-white z-30 shadow-sm">
        {/* LEFT CONTROL: SWITCHES TO BACK NAVIGATION ON SETTINGS */}
        {isSettingsPage ? (
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
            <span className="font-black text-sm tracking-wider text-white">BAZOORA</span>
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

      {/* PRIMARY SCROLLABLE VIEWPORT CONTAINER */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col pb-24">
        <Outlet />
      </main>

      {/* PERSISTENT 3-TAB BOTTOM NAVIGATION */}
      <EcoAideMobileNav
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsAlertsOpen(true)}
      />

      {/* ALERTS AND DISPATCHES BOTTOM SHEET: EDGE-TO-EDGE FLUSH AT BOTTOM AND SIDES */}
      {isAlertsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
          onClick={handleDismissAlerts}
        >
          <div
            className="w-full max-h-[80vh] flex flex-col rounded-t-[28px] bg-white border-t border-slate-200 p-5 pb-8 text-slate-900 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* TACTILE GRAB PILL */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto -mt-1 mb-4 shrink-0" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black uppercase tracking-wide">
                  Live Dispatch Feed
                </h3>
              </div>
              <button
                type="button"
                onClick={handleDismissAlerts}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 py-4">
              {alertsList.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      {alert.priority} Priority
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {alert.time}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {alert.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}