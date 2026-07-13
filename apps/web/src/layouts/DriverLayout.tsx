import { NavLink, Outlet } from "react-router-dom";
import { driverNavItems } from "../routes/navigation";

// Shared chrome for every /driver/* screen. Driver uses a bottom tab bar
// (mobile-first) rather than a sidebar. Pages render into <Outlet />.
export function DriverLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-100 text-gray-900">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-gray-200 bg-white">
        {driverNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                "flex-1 py-3 text-center text-xs",
                isActive ? "font-semibold text-[#1a3a2e]" : "text-gray-500",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
