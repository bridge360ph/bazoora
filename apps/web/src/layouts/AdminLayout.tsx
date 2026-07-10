import { Outlet, useLocation } from "react-router-dom";
import { AdminSidebar } from "./components/AdminSidebar";
import Navbar from "./components/Navbar";

// Shared chrome for every /admin/* screen. The sidebar lives here once;
// each page renders into <Outlet />. Feature screens should NOT re-create
// their own sidebar — they just render their content.

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/eco-aides": "Eco-Aide Management",
  "/admin/fleet": "Fleet Management",
  "/admin/routes": "Route Management",
  "/admin/hauling": "Hauling Request Management",
  "/admin/analytics": "Analytics",
  "/admin/notifications": "Notifications",
  "/admin/settings": "Settings",
};

export function AdminLayout() {
  const location = useLocation();

  const title = pageTitles[location.pathname] ?? "Admin";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f3f5f4]">
      <AdminSidebar />

      <div className="flex flex-1 flex-col min-w-0">
        <Navbar
          title={title}
          notificationCount={0}
          avatarInitials="JD"
        />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}