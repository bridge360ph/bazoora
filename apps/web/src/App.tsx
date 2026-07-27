import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSocket, disconnectSocket } from "./lib/socket";

// Auth
import LoginPage from "./features/auth/components/LoginPage";
import { SettingsPage } from "./features/settings/components/SettingsPage";

// Admin imports
import { AdminLayout } from "./layouts/AdminLayout";
import { AdminHome } from "./pages/AdminHome";
import { RoutePlaceholder } from "./pages/RoutePlaceholder";
import { AdminAnalyticsPage } from "./features/analytics/AdminAnalyticsPage";
import { AdminFleetManagementPage } from "./features/fleet-management/AdminFleetManagementPage";
import { AdminHaulingRequestManagementPage } from "./features/hauling-requests/AdminHaulingRequestManagementPage";

// Driver imports
import { DriverLayout } from "./layouts/DriverLayout";
import DriverDashboard from "./features/driver/DriverDashboard";
import { CurrentRoute } from "./features/driver/CurrentRoute";
import { Collections } from "./features/driver/Collections";
import { ReportIssue } from "./features/driver/ReportIssue";
import { Messages } from "./features/driver/Messages";
import { Settings } from "./features/driver/Settings";

// App.tsx is routing configuration only
function App() {
  useEffect(() => {
  const socket = getSocket(() => {
    return localStorage.getItem("token");
  });

  socket.connect();

  return () => {
    disconnectSocket();
  };
}, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* AUTH */}
        <Route path="/login" element={<LoginPage />} />

        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ADMIN */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />

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
            element={<RoutePlaceholder title="Route Management" />}
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
            element={<RoutePlaceholder title="Notifications" />}
          />

          <Route
            path="settings"
            element={<SettingsPage />}
          />
        </Route>

        {/* DRIVER */}
        <Route path="/driver" element={<DriverLayout />}>
          <Route index element={<DriverDashboard />} />

          <Route
            path="route"
            element={<CurrentRoute />}
          />

          <Route
            path="collections"
            element={<Collections />}
          />

          <Route
            path="report"
            element={<ReportIssue />}
          />

          <Route
            path="messages"
            element={<Messages />}
          />

          <Route
            path="settings"
            element={<Settings />}
          />
        </Route>

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;