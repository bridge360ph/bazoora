import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuthStore, type UserRole } from "@/stores/auth-store";
import { roleHome } from "../roles";

interface ProtectedRouteProps {
  /**
   * When provided, only these roles may access the route. A signed-in user
   * whose role is not allowed is redirected to their own landing route.
   */
  allow?: UserRole[];
}

/**
 * Route guard. Redirects unauthenticated users to /login (preserving the
 * attempted location) and role-mismatched users to their own home. Otherwise
 * renders the nested routes via <Outlet/>.
 */
export function ProtectedRoute({ allow }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return <Outlet />;
}
