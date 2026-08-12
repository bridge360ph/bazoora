import { NavLink } from "react-router-dom";
import { Logo } from "@bazoora/ui";

import { adminNavItems } from "../../routes/navigation";

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  user?: {
    name: string;
    unitId: string;
    avatarInitials: string;
  };
}

export function AdminSidebar({
  isOpen = false,
  onClose,
  user = {
    name: "John Doe",
    unitId: "Unit #4029",
    avatarInitials: "JD",
  },
}: AdminSidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[260px] flex-col border-r border-[#0f2417] bg-brand-dark transition-transform duration-200 ease-out md:static md:z-auto md:w-[200px] md:min-w-[200px] md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-2.5 border-b border-[#0f2417] px-4 py-5">
        <Logo className="h-8 w-8" />

        <div>
          <p className="text-2xl font-bold leading-tight tracking-wide text-white">
            BAZOORA
          </p>
          <p className="text-[10px] leading-tight text-white">HAULING ADMIN</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-green-200 transition-colors hover:text-white md:hidden"
          aria-label="Close menu"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
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
          <p className="truncate text-xs font-medium text-white">{user.name}</p>
          <p className="truncate text-[10px] text-white">{user.unitId}</p>
        </div>

          <NavLink
            to="/admin/settings"
            onClick={onClose}
            aria-label="Settings"
            className="transition-opacity hover:opacity-80"
          >
          <span className="text-lg text-white">⚙</span>
        </NavLink>
      </div>
    </aside>
  );
}
