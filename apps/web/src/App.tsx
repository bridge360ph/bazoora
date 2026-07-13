import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { getSocket } from "./lib/socket";
import { useAuthStore } from "@/stores/auth-store";

import { AdminLayout } from "./layouts/AdminLayout";
import DriverLayout from "./layouts/DriverLayout";

import { AdminHome } from "./pages/AdminHome";
import { RoutePlaceholder } from "./pages/RoutePlaceholder";

import DriverDashboard from "./features/driver/DriverDashboard";
import { CurrentRoute } from "./features/driver/CurrentRoute";
import { Collections } from "./features/driver/Collections";
import { ReportIssue } from "./features/driver/ReportIssue";
import { Messages } from "./features/driver/Messages";
import { Settings } from "./features/driver/Settings";

import LoginPage from "./features/auth/components/LoginPage";

// App.tsx is routing configuration only — please don't turn it back into a
// single dashboard. To ship a screen: replace the matching placeholder element
// below with your page component. Add a nav link in src/routes/navigation.ts.

function App() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const socket = getSocket(
      () => useAuthStore.getState().accessToken
    );

    if (user) {
      socket.connect();
    } else {
      socket.disconnect();
    }

    return () => {
      socket.disconnect();
    };
  }, [user]);


  const getRoleRedirect = () => {
    if (!user) return "/login";

    switch (user.role.toLowerCase()) {
      case "admin":
      case "lgu_admin":
        return "/admin";

      case "driver":
        return "/driver";

      case "eco_aide":
      case "eco-aide":
      case "ecoaide":
        return "/eco-aide";

      case "resident":
        return "/resident";

      default:
        return "/login";
    }
  };


  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={getRoleRedirect()} replace />
            ) : (
              <LoginPage />
            )
          }
        />


        {/* ROOT */}
        <Route
          path="/"
          element={
            <Navigate
              to={getRoleRedirect()}
              replace
            />
          }
        />



        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            user ? (
              <AdminLayout />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >

          <Route index element={<AdminHome />} />

          <Route
            path="eco-aides"
            element={
              <RoutePlaceholder title="Eco-Aide Management" />
            }
          />

          <Route
            path="fleet"
            element={
              <RoutePlaceholder title="Fleet Management" />
            }
          />

          <Route
            path="routes"
            element={
              <RoutePlaceholder title="Route Management" />
            }
          />

          <Route
            path="hauling"
            element={
              <RoutePlaceholder title="Hauling Request Management" />
            }
          />

          <Route
            path="analytics"
            element={
              <RoutePlaceholder title="Analytics" />
            }
          />

          <Route
            path="notifications"
            element={
              <RoutePlaceholder title="Notifications" />
            }
          />

          <Route
            path="settings"
            element={
              <RoutePlaceholder title="Settings" />
            }
          />

        </Route>




        {/* DRIVER */}
        <Route
          path="/driver"
          element={
            user ? (
              <DriverLayout />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >

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




        {/* ECO AIDE */}
        <Route
          path="/eco-aide"
          element={
            user ? (
              <RoutePlaceholder title="Eco-Aide Dashboard" />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />



        {/* RESIDENT */}
        <Route
          path="/resident"
          element={
            user ? (
              <RoutePlaceholder title="Resident Dashboard" />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />



        {/* UNKNOWN */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;