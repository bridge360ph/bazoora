import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AdminSidebar } from "./components/AdminSidebar";
import Navbar from "./components/Navbar";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = pageTitles[location.pathname] ?? "Admin";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f3f5f4]">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
        }}
      />

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => {
            setSidebarOpen(false);
          }}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          title={title}
          notificationCount={0}
          avatarInitials="JD"
          onMenuToggle={() => {
            setSidebarOpen((current) => !current);
          }}
        />

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}