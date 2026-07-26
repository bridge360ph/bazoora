import { NavLink } from "react-router-dom";
import { Logo } from "@bazoora/ui";

import { adminNavItems } from "../../routes/navigation";

interface AdminSidebarProps {
  user?: {
    name: string;
    unitId: string;
    avatarInitials: string;
  };
}

export function AdminSidebar({
  user = {
    name: "John Doe",
    unitId: "Unit #4029",
    avatarInitials: "JD",
  },
}: AdminSidebarProps) {
  return (
    <aside className="flex h-screen w-[200px] min-w-[200px] flex-col border-r border-[#0f2417] bg-brand-dark">
      <div className="flex items-center gap-2.5 border-b border-[#0f2417] px-4 py-5">
        <Logo className="h-8 w-8" />

        <div>
          <p className="text-2xl font-bold leading-tight tracking-wide text-white">
            BAZOORA
          </p>
          <p className="text-[10px] leading-tight text-white">
            HAULING ADMIN
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="block"
          >
            {({ isActive }) => (
              <div
                className={`
                  relative flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                  ${
                    isActive
                      ? "bg-accent-dark text-white"
                      : "text-green-200 hover:bg-[#224a2d] hover:text-white"
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-accent-light" />
                )}

                {item.icon && (
                  <img
                    src={item.icon}
                    alt=""
                    className="h-5 w-5 shrink-0"
                  />
                )}

                <span>{item.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-[#0f2417] px-3 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4a9e5c] text-xs font-semibold text-white">
          {user.avatarInitials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-white">
            {user.name}
          </p>
          <p className="truncate text-[10px] text-white">
            {user.unitId}
          </p>
        </div>

        <NavLink
          to="/admin/settings"
          aria-label="Settings"
          className="transition-opacity hover:opacity-80"
        >
          <span className="text-lg text-white">⚙</span>
        </NavLink>
      </div>
    </aside>
  );
}