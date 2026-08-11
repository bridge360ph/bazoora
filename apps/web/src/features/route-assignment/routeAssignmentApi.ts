import axios from "axios";
import type {
  Route,
  AssignEcoAideRequest,
  UserSummary
} from "@bazoora/shared";

import { apiClient } from "@/lib/api-client";

/**
 * Route-assignment API calls.
 *
 * These go through `apiClient` so every request carries the access token and
 * can silently refresh once on 401. The assignment endpoints are guarded by
 * `authGuard` + `requireRole`, so a plain `fetch` would always be rejected.
 */

function toApiError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const message = (
      error.response?.data as { message?: string } | undefined
    )?.message;

    if (message !== undefined && message !== "") {
      return new Error(message);
    }
  }

  return new Error(fallback);
}

export async function assignRouteEcoAideRequest(
  routeId: string,
  ecoAideId: string | null,
): Promise<Route> {
  const body: AssignEcoAideRequest = { ecoAideId };

  try {
    const { data } = await apiClient.patch<Route>(
      `/routes/${routeId}/assign-eco-aide`,
      body,
    );
    return data;
  } catch (error) {
    throw toApiError(error, "Failed to assign Eco-Aide");
  }
}

/**
 * Fetches all Users with role ECO_AIDE, now absorbed into the Route
 * Assignment API as GET /routes/eco-aides. Availability
 * (assignedRoute == null) is computed by getAvailableEcoAides below against
 * the routes list, not filtered here, so a "currently assigned" Eco-Aide
 * can still be shown as the selected value when editing.
 */
export async function fetchEcoAideUsers(): Promise<UserSummary[]> {
  try {
    const { data } = await apiClient.get<UserSummary[]>(
      "/routes/eco-aides",
    );
    return data;
  } catch (error) {
    throw toApiError(error, "Failed to fetch Eco-Aides");
  }
}

/**
 * assignedEcoAideId is @unique on Route, so an Eco-Aide can hold at most one
 * route. Same shape as getAvailableTrucks: exclude anyone already assigned
 * to a DIFFERENT route, but always keep the current route's own Eco-Aide
 * selectable when editing.
 */
export function getAvailableEcoAides(
  ecoAides: UserSummary[],
  routes: Route[],
  editingRouteId?: string,
  assignedEcoAideId?: string | null,
): UserSummary[] {

  const editingRoute = routes.find(
    (route) => route.id === editingRouteId,
  );

  const currentEcoAideId =
    assignedEcoAideId ?? editingRoute?.assignedEcoAideId ?? null;

  const takenEcoAideIds = new Set(
    routes
      .filter((route) => route.id !== editingRouteId)
      .map((route) => route.assignedEcoAideId)
      .filter((id): id is string => Boolean(id)),
  );

  return ecoAides.filter((ecoAide) => {
    if (ecoAide.id === currentEcoAideId) {
      return true;
    }

    return !takenEcoAideIds.has(ecoAide.id);
  });
}
