import axios from "axios";
import type {
  Route,
  AssignEcoAideRequest,
  AssignTruckRequest,
  RouteTruckOption,
  UserSummary
} from "@bazoora/shared";

import { apiClient } from "@/lib/api-client";
import { branchById, haversineMeters } from "@/lib/branches";

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

export async function assignRouteTruckRequest(
  routeId: string,
  truckId: string | null,
): Promise<Route> {
  const body: AssignTruckRequest = { truckId };

  try {
    const { data } = await apiClient.patch<Route>(
      `/routes/${routeId}/assign-truck`,
      body,
    );
    return data;
  } catch (error) {
    throw toApiError(error, "Failed to assign truck");
  }
}

export async function fetchTruckOptions(): Promise<RouteTruckOption[]> {
  try {
    const { data } = await apiClient.get<RouteTruckOption[]>(
      "/routes/trucks",
    );
    return data;
  } catch (error) {
    throw toApiError(error, "Failed to fetch trucks");
  }
}

/**
 * assignedTruckId is @unique on Route, so a truck can serve one route at a
 * time. Leaves out trucks on a different route, but keeps the current
 * route's own truck so it shows as selected.
 */
export function getAvailableTrucks(
  trucks: RouteTruckOption[],
  routeId: string,
): RouteTruckOption[] {
  return trucks.filter(
    (truck) =>
      truck.assignedRouteId === null || truck.assignedRouteId === routeId,
  );
}

export function formatTruckOption(truck: {
  truckNumber: string | null;
  plateNumber: string;
}): string {
  return `${truck.truckNumber ?? "Pending ID"} (${truck.plateNumber})`;
}

/** Trucks for the route's waste type, plus the truck already on it. */
export function getTrucksForWasteType(
  trucks: RouteTruckOption[],
  wasteType: string,
  currentTruckId: string | null = null,
): RouteTruckOption[] {
  return trucks.filter(
    (truck) =>
      truck.id === currentTruckId || truck.wasteType === wasteType,
  );
}

/**
 * A weekly (Free) route is served by trucks from the branch it is run from.
 * Paid routes start from the truck's branch, so any branch is offered.
 * The truck already on the route is always kept.
 */
export function getTrucksForBranch(
  trucks: RouteTruckOption[],
  routeType: string,
  branchId: string | null,
  currentTruckId: string | null = null,
): RouteTruckOption[] {
  if (routeType === "Paid" || !branchById(branchId)) return trucks;
  return trucks.filter((truck) => truck.id === currentTruckId || truck.branchId === branchId);
}

/**
 * Trucks from the route's branch first, then the others by straight-line
 * distance from that branch, and trucks with no branch last.
 */
export function sortTrucksByBranch(
  trucks: RouteTruckOption[],
  branchId: string | null,
): RouteTruckOption[] {
  const home = branchById(branchId);
  const rank = (truck: RouteTruckOption): number => {
    const branch = branchById(truck.branchId);
    if (!branch) return Number.POSITIVE_INFINITY;
    if (!home || branch.id === home.id) return 0;
    return haversineMeters(home, branch);
  };

  return [...trucks].sort((a, b) => rank(a) - rank(b));
}

/** "T-004 (ABC-123) · Imus Branch" */
export function formatTruckWithBranch(truck: RouteTruckOption): string {
  return `${formatTruckOption(truck)} · ${branchById(truck.branchId)?.name ?? "No branch"}`;
}
