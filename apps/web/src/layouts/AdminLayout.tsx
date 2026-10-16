import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  Truck,
  Route as RouteIcon,
  ClipboardList,
  ChartColumn,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore, type UserRole } from "@/stores/auth-store";
import { adminNavItems } from "../routes/navigation";

// Mirrors ResidentLayout so the admin and resident portals share one look.

const navIcons: Record<string, LucideIcon> = {
  Dashboard: LayoutGrid,
  "Eco-Aide Management": Users,
  "Fleet Management": Truck,
  "Route Management": RouteIcon,
  "Hauling Request Management": ClipboardList,
  Analytics: ChartColumn,
  Notifications: Bell,
  Settings: Settings,
};

const roleLabels: Partial<Record<UserRole, string>> = {
  super_admin: "Super Admin",
  government_agency: "Government Agency",
  lgu: "LGU",
  hauling_org: "Hauling Organization",
  business_org: "Business Organization",
};

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clear);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userInitials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "JD";

  const userFullName = user ? `${user.firstName} ${user.lastName}` : "John Doe";

  const userRoleLabel = (user && roleLabels[user.role]) ?? "Administrator";

  // Active route label for the header title
  const activeLabel =
    adminNavItems.find((item) => {
      if (item.end) return location.pathname === item.to;
      return location.pathname.startsWith(item.to);
    })?.label ?? "Admin";

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-full w-full overflow-hidden font-sans bg-gray-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a1811] flex flex-col shrink-0 text-gray-300 transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-emerald-500 text-xl font-black">▣</span>
            <div>
              <div className="font-black text-white text-base tracking-wider leading-none">
                BAZOORA
              </div>
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                HAULING ADMIN
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="text-gray-400 hover:text-white transition-colors md:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = navIcons[item.label] ?? LayoutGrid;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 w-full px-6 py-3 text-sm font-semibold transition-all border-l-[3px] ${
                    isActive
                      ? "bg-white/5 text-white border-emerald-500 font-bold"
                      : "text-gray-400 hover:text-gray-200 border-transparent hover:bg-white/2"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-500" : "text-gray-400"}`}
                    />
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
            <div className="text-[10px] text-gray-500 truncate">{userRoleLabel}</div>
          </div>
          <NavLink
            to="/admin/settings"
            onClick={closeSidebar}
            className="text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </NavLink>
          <button
            type="button"
            onClick={() => clearSession()}
            className="text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main Container */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="relative h-16 bg-[#0a1811] border-b border-[#0a1811] px-8 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              setSidebarOpen((current) => !current);
            }}
            className="p-2 -ml-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="absolute left-1/2 -translate-x-1/2 font-inter text-base font-bold text-white!">
            {activeLabel}
          </h2>
          <div className="ml-auto flex items-center gap-4">
            <NavLink
              to="/admin/notifications"
              className="relative p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer"
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
        <main
          key={location.pathname}
          className="report-slide-in min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
