import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { socket } from "./lib/socket";
import { RoutePlaceholder } from "./pages/RoutePlaceholder";
// admin imports
import { AdminLayout } from "./layouts/AdminLayout";
import { AdminHome } from "./pages/AdminHome";
import { AdminHaulingRequestManagementPage }
  from "./features/hauling-requests/AdminHaulingRequestManagementPage";
// driver imports
import { DriverLayout } from "./layouts/DriverLayout";

// App.tsx is routing configuration only — please don't turn it back into a
// single dashboard. To ship a screen: replace the matching placeholder element
// below with your page component. Add a nav link in src/routes/navigation.ts.
function App() {
  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

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
            element={<AdminHaulingRequestManagementPage />}
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

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;