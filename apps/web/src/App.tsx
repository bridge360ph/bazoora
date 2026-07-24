import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { getSocket } from "./lib/socket";
import { useAuthStore, type UserRole } from "@/stores/auth-store";
import { RoutePlaceholder } from "./pages/RoutePlaceholder";

// Layout Imports
import { AdminLayout } from "./layouts/AdminLayout";

// driver imports
import { DriverLayout } from "./layouts/DriverLayout";
import ResidentLayout from "./features/residents/components/ResidentLayout";
import EcoAideLayout from "./features/eco-aide/components/EcoAideLayout";

// Page Imports
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminAnalyticsPage } from "./features/analytics/AdminAnalyticsPage";
import { AdminFleetManagementPage } from "./features/fleet-management/AdminFleetManagementPage";
import { AdminRouteManagementPage } from "./features/route-management/AdminRouteManagementPage";
import { AdminHaulingRequestManagementPage } from "./features/hauling-requests/AdminHaulingRequestManagementPage";
import { SettingsPage } from "./features/settings/components/SettingsPage";
import { NotificationsPage } from "./features/notifications/components/NotificationsPage";

// Driver Pages
import DriverDashboard from "./features/driver/DriverDashboard";
import DriverRoute from "./features/driver/components/DriverRoute";
import { Collections } from "./features/driver/Collections";
import { ReportIssue } from "./features/driver/ReportIssue";
import { Messages } from "./features/driver/Messages";
import { Settings } from "./features/driver/Settings";

// Resident Pages
import TrackTruckPage from "./features/residents/components/TrackTruckPage";

// Eco-Aide Pages
import EcoAideRoute from "./features/eco-aide/components/EcoAideRoute";

function AppContent() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clear);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

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

  const handleRoleChange = (role: string) => {
    if (!user) return;
    setSession(
      {
        ...user,
        role: (role === "admin" ? "super_admin" : role) as UserRole,
        email: `${role}@bazoora.com`,
        firstName: role === "resident" ? "Jane" : role === "driver" ? "John" : role === "eco_aide" ? "Eco" : "Admin",
        lastName: role === "resident" ? "Smith" : role === "driver" ? "Doe" : role === "eco_aide" ? "Aide" : "User",
        id: `usr-mock-${role}-1`,
      },
      `mock-token-${role}`
    );

    if (role === "admin") {
      void navigate("/admin");
    } else if (role === "driver") {
      void navigate("/driver");
    } else if (role === "eco_aide") {
      void navigate("/eco-aide");
    } else if (role === "resident") {
      void navigate("/resident");
    }
  };

  const getActiveRoleKey = (): string => {
    const role = user?.role;
    if (role === "super_admin" || role === "government_agency" || role === "lgu") {
      return "admin";
    }
    return role ?? "resident";
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">
      {/* Sleek glassmorphic role selector banner */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white/85 px-6 py-3 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-slate-900/85 shrink-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black tracking-wider text-[#1a3a2e] dark:text-[#4ade80]">
             BAZOORA
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
            DEMO ENVIRONMENT
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
            Role Simulator:
          </span>
          <div className="flex rounded-lg bg-gray-150 p-0.5 dark:bg-slate-800">
            {(["resident", "driver", "eco_aide", "admin"] as const).map((r) => {
              const activeKey = getActiveRoleKey();
              return (
                <button
                  key={r}
                  onClick={() => handleRoleChange(r)}
                  className={`rounded-md px-3 py-1 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    activeKey === r
                      ? "bg-[#1a3a2e] text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {r.replace("_", "-").toUpperCase()}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => clearSession()}
            className="ml-3 rounded-md border border-gray-300 bg-white hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 px-3 py-1 text-xs font-black text-red-500 transition-all active:scale-95 cursor-pointer"
          >
            RESET
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <Routes>
          {/* Base Redirect */}
          <Route
            path="/"
            element={
              <Navigate
                to={
                  user?.role === "driver"
                    ? "/driver"
                    : user?.role === "eco_aide"
                    ? "/eco-aide"
                    : user?.role === "super_admin" || user?.role === "government_agency"
                    ? "/admin"
                    : "/resident"
                }
                replace
              />
            }
          />

          {/* ADMIN */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route
              path="eco-aides"
              element={<RoutePlaceholder title="Eco-Aide Management" />}
            />
            <Route
              path="fleet"
              element={<AdminFleetManagementPage />}
            />
            <Route
              path="routes"
              element={<AdminRouteManagementPage />}
            />
            <Route
              path="hauling"
              element={<AdminHaulingRequestManagementPage />}
            />
            <Route
              path="analytics"
              element={<AdminAnalyticsPage />}
            />
            <Route
              path="notifications"
              element={<NotificationsPage />}
            />
            <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route
              path="route-management"
              element={<AdminRouteManagementPage />}
            />

          {/* DRIVER */}
          <Route path="/driver" element={<DriverLayout />}>
            <Route index element={<DriverDashboard />} />
            <Route path="route" element={<DriverRoute />} />
            <Route path="collections" element={<Collections />} />
            <Route path="report" element={<ReportIssue />} />
            <Route path="messages" element={<Messages />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* RESIDENT */}
          <Route path="/resident" element={<ResidentLayout />}>
            <Route index element={<Navigate to="/resident/track" replace />} />
            <Route path="track" element={<TrackTruckPage />} />
          </Route>

          {/* ECO-AIDE */}
          <Route path="/eco-aide" element={<EcoAideLayout />}>
            <Route index element={<Navigate to="/eco-aide/route" replace />} />
            <Route path="route" element={<EcoAideRoute />} />
          </Route>

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}