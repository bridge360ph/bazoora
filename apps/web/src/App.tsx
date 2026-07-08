import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth-store";
import { AdminLayout } from "./layouts/AdminLayout";
import { DriverLayout } from "./layouts/DriverLayout";
import { AdminHome } from "./pages/AdminHome";
import { RoutePlaceholder } from "./pages/RoutePlaceholder";

// Driver Pages
import DriverDashboard from "./features/driver/components/DriverDashboard";
import DriverRoute from "./features/driver/components/DriverRoute";
import DriverHistory from "./features/driver/components/DriverHistory";
import DriverSettings from "./features/driver/components/DriverSettings";

// App.tsx is routing configuration only — please don't turn it back into a
// single dashboard. To ship a screen: replace the matching placeholder element
// below with your page component. Add a nav link in src/routes/navigation.ts.
function App() {
  const user = useAuthStore((s) => s.user);

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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route
            path="eco-aides"
            element={<RoutePlaceholder title="Eco-Aide Management" />}
          />
          <Route
            path="fleet"
            element={<RoutePlaceholder title="Fleet Management" />}
          />
          <Route
            path="routes"
            element={<RoutePlaceholder title="Route Management" />}
          />
          <Route
            path="hauling"
            element={<RoutePlaceholder title="Hauling Request Management" />}
          />
          <Route
            path="analytics"
            element={<RoutePlaceholder title="Analytics" />}
          />
          <Route
            path="notifications"
            element={<RoutePlaceholder title="Notifications" />}
          />
          <Route
            path="settings"
            element={<RoutePlaceholder title="Settings" />}
          />
        </Route>

        <Route path="/driver" element={<DriverLayout />}>
          <Route index element={<DriverDashboard />} />
          <Route path="route" element={<DriverRoute />} />
          <Route path="history" element={<DriverHistory />} />
          <Route path="settings" element={<DriverSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
