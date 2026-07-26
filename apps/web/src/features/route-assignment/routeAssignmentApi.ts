import type {
  Route,
  AssignEcoAideRequest,
  AssignTruckRequest,
  UserSummary,
} from "@bazoora/shared";
import type { Truck } from "../trucks/schemas";

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


export async function assignRouteTruckRequest(
  routeId: string,
  truckId: string,
): Promise<Route> {
  const body: AssignTruckRequest = { truckId };

  const response = await fetch(`${ROUTES_API_URL}/${routeId}/assign-truck`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Failed to assign Truck");
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
 * A truck is available for assignment if:
 * - it isn't already assignedTruckId on some OTHER route, and
 * - its status is "active"
 *
 * The truck currently assigned to THIS route (when editing) is always
 * included, even if its status isn't "active", so the existing value stays
 * selectable in the dropdown.
 */
export function getAvailableTrucks(
  trucks: Truck[],
  routes: Route[],
  editingRouteId?: string,
): Truck[] {
  const editingRoute = routes.find(
    (route) => route.id === editingRouteId,
  );

  const currentTruckId = editingRoute?.assignedTruckId ?? null;

  const takenTruckIds = new Set(
    routes
      .filter((route) => route.id !== editingRouteId)
      .map((route) => route.assignedTruckId)
      .filter((id): id is string => id !== null),
  );

  return trucks.filter((truck) => {
    /**
     * Keep the truck currently assigned to this route visible.
     *
     * This allows editing an existing route without the selected
     * truck disappearing from the dropdown.
     */
    if (truck.id === currentTruckId) {
      return true;
    }

    /**
     * One-to-one relationship:
     * A truck already assigned to another route cannot be selected.
     */
    if (takenTruckIds.has(truck.id)) {
      return false;
    }

    /**
     * Fleet availability:
     * Trucks marked as maintenance cannot be assigned.
     *
     * Idle and active trucks remain selectable because the existing
     * fleet implementation uses idle trucks for planned routes.
     */
    return truck.status !== "maintenance";
  });
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
