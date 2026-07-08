import { NavLink, Outlet } from "react-router-dom";
import { driverNavItems } from "../routes/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { LogOut, LayoutGrid, Map, History, Settings } from "lucide-react";

export function DriverLayout() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clear);

  const userInitials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "DR";

  // Helper to map route label to lucide icons
  const getIcon = (label: string) => {
    switch (label) {
      case "Dashboard":
        return <LayoutGrid className="w-5 h-5 mb-0.5" />;
      case "Collection Route":
        return <Map className="w-5 h-5 mb-0.5" />;
      case "Route History":
        return <History className="w-5 h-5 mb-0.5" />;
      case "Settings":
        return <Settings className="w-5 h-5 mb-0.5" />;
      default:
        return <LayoutGrid className="w-5 h-5 mb-0.5" />;
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {/* Top Header */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-emerald-500 font-black text-lg">▣</span>
          <span className="font-black text-sm tracking-wider text-slate-900 dark:text-white uppercase">
            DRIVER PORTAL
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center font-black text-xs text-[#0a1811]">
            {userInitials}
          </div>
          <button
            onClick={() => clearSession()}
            className="p-1 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors cursor-pointer"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16 relative">
        <Outlet />
      </main>

      {/* Bottom Tabs Nav */}
      <nav className="fixed inset-x-0 bottom-0 flex border-t border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-800 z-10 shadow-lg">
        {driverNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                "flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-bold transition-all",
                isActive
                  ? "text-emerald-600 dark:text-emerald-400 font-black scale-105"
                  : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300",
              ].join(" ")
            }
          >
            {getIcon(item.label)}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default DriverLayout;
