import { useState } from "react";
import { AdminLayout } from "../features/admin/components/AdminLayout";
import { HaulingRequestManagementAdmin } from "../features/hauling-requests/HaulingRequestManagementAdmin";

/**
 * Route-level page for Admin > Hauling Request Management.
 *
 * TODO: `activePath`/`onNavigate` are local state stand-ins until real
 * routing (e.g. React Router) is added. `user` is a static placeholder
 * until admin auth/session data exists.
 */
export function AdminHaulingRequestManagementPage() {
  const [activePath, setActivePath] = useState("/admin/hauling-requests");

  return (
    <AdminLayout
      title="Hauling Request Management"
      activePath={activePath}
      onNavigate={setActivePath}
      user={{ name: "John Doe", unitId: "Unit #4029", avatarInitials: "JD" }}
      onSettingsClick={() => setActivePath("/admin/settings")}
      notificationCount={0}
    >
      <HaulingRequestManagementAdmin />
    </AdminLayout>
  );
}