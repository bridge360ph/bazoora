import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSocket } from "./lib/socket";
import { useAuthStore } from "@/stores/auth-store";

// Layout Imports
import EcoAideLayout from "./features/eco-aide/components/EcoAideLayout";

// Page Imports
import LoginPage from "./features/auth/components/LoginPage";

// Eco-Aide Pages
import EcoAideRoute from "./features/eco-aide/components/EcoAideRoute";

function AppContent() {
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

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          {/* Base Redirect */}
          <Route
            path="/"
            element={<Navigate to="/eco-aide/route" replace />}
          />

          {/* Eco-Aide Routes */}
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