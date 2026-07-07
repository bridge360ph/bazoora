import { NavLink, Outlet } from "react-router-dom";
import { adminNavItems } from "../routes/navigation";

// Shared chrome for every /admin/* screen. The sidebar lives here once;
// each page renders into <Outlet />. Feature screens should NOT re-create
// their own sidebar — they just render their content.
export function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 text-gray-900">
      <aside className="flex w-56 shrink-0 flex-col bg-[#1a3a2e] text-white">
        <div className="border-b border-white/10 px-4 py-4">
          <div className="text-sm font-extrabold tracking-widest">BAZOORA</div>
          <div className="text-[10px] uppercase tracking-widest text-white/50">
            Hauling Admin
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "block border-l-[3px] px-4 py-2 text-[13px]",
                  isActive
                    ? "border-emerald-400 bg-white/10 font-semibold text-white"
                    : "border-transparent text-white/60 hover:bg-white/5",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
