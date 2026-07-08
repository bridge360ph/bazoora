import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth-store";
import { AdminLayout } from "./layouts/AdminLayout";
import { DriverLayout } from "./layouts/DriverLayout";
import { AdminHome } from "./pages/AdminHome";
import { RoutePlaceholder } from "./pages/RoutePlaceholder";

// Eco-Aide Pages
import EcoAideLayout from "./features/eco-aide/components/EcoAideLayout";
import EcoAideDashboard from "./features/eco-aide/components/EcoAideDashboard";
import EcoAideRoute from "./features/eco-aide/components/EcoAideRoute";
import EcoAideTasks from "./features/eco-aide/components/EcoAideTasks";
import EcoAideSettings from "./features/eco-aide/components/EcoAideSettings";

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
          <Route index element={<RoutePlaceholder title="Driver Dashboard" />} />
          <Route
            path="route"
            element={<RoutePlaceholder title="Current Route" />}
          />
          <Route
            path="collections"
            element={<RoutePlaceholder title="Collections" />}
          />
        </Route>

        {/* Eco-Aide Routes */}
        <Route path="/eco-aide" element={<EcoAideLayout />}>
          <Route index element={<EcoAideDashboard />} />
          <Route path="route" element={<EcoAideRoute />} />
          <Route path="tasks" element={<EcoAideTasks />} />
          <Route path="settings" element={<EcoAideSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
