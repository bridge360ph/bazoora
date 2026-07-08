import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { getSocket } from "./lib/socket";
import { useAuthStore } from "@/stores/auth-store";

// Layout Imports
import ResidentLayout from "./features/residents/components/ResidentLayout";

// Page Imports
import LoginPage from "./features/auth/components/LoginPage";

// Resident Pages
import ResidentDashboard from "./features/residents/components/ResidentDashboard";
import TrackTruckPage from "./features/residents/components/TrackTruckPage";
import ResidentHaulingRequests from "./features/residents/components/ResidentHaulingRequests";
import ResidentSchedule from "./features/residents/components/ResidentSchedule";
import ResidentReports from "./features/residents/components/ResidentReports";
import ResidentNotifications from "./features/residents/components/ResidentNotifications";
import ResidentSettings from "./features/residents/components/ResidentSettings";

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
        role: role as "resident" | "driver" | "eco_aide" | "hauling_org",
        email: `${role}@bazoora.com`,
      },
      useAuthStore.getState().accessToken ?? "mock-token-123"
    );

    if (role === "hauling_org") {
      void navigate("/admin");
    } else if (role === "driver") {
      void navigate("/driver");
    } else if (role === "eco_aide") {
      void navigate("/eco-aide");
    } else if (role === "resident") {
      void navigate("/resident");
    }
  };

  if (!user) {
    return <LoginPage />;
  }

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
            {(["resident", "driver", "eco_aide", "hauling_org"] as const).map((r) => {
              const displayRole = user?.role;
              return (
                <button
                  key={r}
                  onClick={() => handleRoleChange(r)}
                  className={`rounded-md px-3 py-1 text-xs font-bold transition-all active:scale-95 ${
                    displayRole === r
                      ? "bg-[#1a3a2e] text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {r === "hauling_org" ? "Admin" : r.replace("_", "-").toUpperCase()}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => clearSession()}
            className="ml-3 rounded-md border border-gray-300 bg-white hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 px-3 py-1 text-xs font-black text-red-500 transition-all active:scale-95 cursor-pointer"
          >
            SIGN OUT
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
                  user.role === "hauling_org"
                    ? "/admin"
                    : user.role === "driver"
                    ? "/driver"
                    : user.role === "eco_aide"
                    ? "/eco-aide"
                    : "/resident"
                }
                replace
              />
            }
          />

          {/* Resident Routes */}
          <Route path="/resident" element={<ResidentLayout />}>
            <Route index element={<ResidentDashboard />} />
            <Route path="track" element={<TrackTruckPage />} />
            <Route path="hauling" element={<ResidentHaulingRequests />} />
            <Route path="schedule" element={<ResidentSchedule />} />
            <Route path="reports" element={<ResidentReports />} />
            <Route path="notifications" element={<ResidentNotifications />} />
            <Route path="settings" element={<ResidentSettings />} />
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
