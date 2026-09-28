import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSocket } from "./lib/socket";
import { useAuthStore } from "@/stores/auth-store";
import { LoginPage } from "@/features/auth/components/LoginPage";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { useSessionBootstrap } from "@/features/auth/useSessionBootstrap";
import { roleHome } from "@/features/auth/roles";

// LAYOUT IMPORTS
import { AdminLayout } from "./layouts/AdminLayout";
import { DriverLayout } from "./layouts/DriverLayout";
import ResidentLayout from "./features/residents/components/ResidentLayout";
import EcoAideLayout from "./features/eco-aide/components/EcoAideLayout";

// PAGE IMPORTS
import { AdminDashboard } from "./pages/AdminDashboard";
import { EcoAideManagementPage } from "./features/eco-aides/components/EcoAideManagementPage";
import { AdminAnalyticsPage } from "./features/analytics/AdminAnalyticsPage";
import { AdminFleetManagementPage } from "./features/fleet-management/AdminFleetManagementPage";
import { AdminRouteManagementPage } from "./features/route-management/AdminRouteManagementPage";
import { AdminHaulingRequestManagementPage } from "./features/hauling-requests/AdminHaulingRequestManagementPage";
import { SettingsPage } from "./features/settings/components/SettingsPage";
import { NotificationsPage } from "./features/notifications/components/NotificationsPage";
import { NotificationListener } from "./features/notifications/components/NotificationListener";

// DRIVER PAGES
import DriverDashboard from "./features/driver/DriverDashboard";
import DriverRoute from "./features/driver/components/DriverRoute";
import { Collections } from "./features/driver/Collections";
import { ReportIssue } from "./features/driver/ReportIssue";
import { Messages } from "./features/driver/Messages";
import { Settings } from "./features/driver/Settings";

// RESIDENT PAGES
import TrackTruckPage from "./features/residents/components/TrackTruckPage";

// ECO-AIDE PAGES
import EcoAideRoute from "./features/eco-aide/components/EcoAideRoute";

function AppContent() {
  const user = useAuthStore((s) => s.user);
  const bootstrapped = useSessionBootstrap();

  useEffect(() => {
    const s = getSocket(() => useAuthStore.getState().accessToken);
    if (user) {
      s.connect();
    } else {
      s.disconnect();
    }

    return () => {
      s.disconnect();
    };
  }, [user]);

  if (!bootstrapped) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div
          role="status"
          aria-label="Loading"
          className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand"
        />
      </div>
    );
  }

  return (
    <>
      <NotificationListener />
      <div className="flex h-screen flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">
        <div className="flex-1 overflow-hidden relative">
          <Routes>
            {/* PUBLIC */}
            <Route path="/login" element={<LoginPage />} />

            {/* BASE REDIRECT */}
            <Route
              path="/"
              element={<Navigate to={user ? roleHome(user.role) : "/login"} replace />}
            />

            {/* ADMIN */}
            <Route
              element={
                <ProtectedRoute
                  allow={["super_admin", "government_agency", "lgu", "hauling_org", "business_org"]}
                />
              }
            >
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="eco-aides" element={<EcoAideManagementPage />} />
                <Route path="fleet" element={<AdminFleetManagementPage />} />
                <Route path="routes" element={<AdminRouteManagementPage />} />
                <Route path="hauling" element={<AdminHaulingRequestManagementPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* DRIVER */}
            <Route element={<ProtectedRoute allow={["driver"]} />}>
              <Route path="/driver" element={<DriverLayout />}>
                <Route index element={<DriverDashboard />} />
                <Route path="route" element={<DriverRoute />} />
                <Route path="collections" element={<Collections />} />
                <Route path="report" element={<ReportIssue />} />
                <Route path="messages" element={<Messages />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            {/* RESIDENT */}
            <Route element={<ProtectedRoute allow={["resident", "business", "citizen"]} />}>
              <Route path="/resident" element={<ResidentLayout />}>
                <Route index element={<Navigate to="/resident/track" replace />} />
                <Route path="track" element={<TrackTruckPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* ECO-AIDE */}
            <Route element={<ProtectedRoute allow={["eco_aide"]} />}>
              <Route path="/eco-aide" element={<EcoAideLayout />}>
                <Route index element={<Navigate to="/eco-aide/route" replace />} />
                <Route path="route" element={<EcoAideRoute />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* FALLBACK REDIRECT */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}