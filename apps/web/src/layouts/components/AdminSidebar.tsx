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
    <aside className="flex flex-col w-[200px] min-w-[200px] h-screen bg-[#072217] border-r border-[#0f2417]">
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[#0f2417]">
        <Logo className="w-8 h-8" />

        <div>
          <p className="text-white font-bold text-2xl leading-tight tracking-wide">
            BAZOORA
          </p>
          <p className="text-white text-[10px] leading-tight">
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
            className={({ isActive }) =>
              `
                flex w-full items-center px-4 py-2.5 text-sm transition-colors
                ${
                  isActive
                    ? "bg-[#2a5c38] text-white"
                    : "text-green-200 hover:bg-[#224a2d] hover:text-white"
                }
              `
            }
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 px-3 py-3 border-t border-[#0f2417]">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#4a9e5c] text-white text-xs font-semibold">
          {user.avatarInitials}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">
            {user.name}
          </p>
          <p className="text-white text-[10px] truncate">
            {user.unitId}
          </p>
        </div>

        <NavLink
          to="/admin/settings"
          className="text-green-300 hover:text-white"
          aria-label="Settings"
        >
          <span className="text-xs">⚙</span>
        </NavLink>
      </div>
    </aside>
  );
}