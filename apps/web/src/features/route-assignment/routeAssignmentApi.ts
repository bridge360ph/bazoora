import type {
  Route,
  AssignEcoAideRequest,
  UserSummary
} from "@bazoora/shared";

const ROUTES_API_URL = "http://localhost:3000/routes";


export async function assignRouteEcoAideRequest(
  routeId: string,
  ecoAideId: string,
): Promise<Route> {
  const body: AssignEcoAideRequest = { ecoAideId };

  const response = await fetch(`${ROUTES_API_URL}/${routeId}/assign-eco-aide`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Failed to assign Eco-Aide");
  }

  return response.json();
}


/**
 * Fetches all Users with role ECO_AIDE, now absorbed into the Route
 * Assignment API as GET /routes/eco-aides. Availability
 * (assignedRoute == null) is computed by getAvailableEcoAides below against
 * the routes list, not filtered here, so a "currently assigned" Eco-Aide
 * can still be shown as the selected value when editing.
 */
export async function fetchEcoAideUsers(): Promise<UserSummary[]> {
  const response = await fetch(`${ROUTES_API_URL}/eco-aides`);

  if (!response.ok) {
    throw new Error("Failed to fetch Eco-Aides");
  }

  return response.json();
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
): UserSummary[] {
  const editingRoute = routes.find(
    (route) => route.id === editingRouteId,
  );
  const currentEcoAideId = editingRoute?.assignedEcoAideId ?? null;

  const takenEcoAideIds = new Set(
    routes
      .filter((route) => route.id !== editingRouteId)
      .map((route) => route.assignedEcoAideId)
      .filter((id): id is string => id !== null),
  );

  return ecoAides.filter((ecoAide) => {
    if (ecoAide.id === currentEcoAideId) {
      return true;
    }

    return !takenEcoAideIds.has(ecoAide.id);
  });
}
