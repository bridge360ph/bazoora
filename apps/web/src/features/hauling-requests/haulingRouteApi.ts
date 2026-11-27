import type {
  CreatePaidHaulingRouteInput,
  HaulingRequest,
  HaulingRouteOption,
  Route,
} from "@bazoora/shared";

import { apiClient } from "@/lib/api-client";
import { toHaulingRequestError } from "./haulingRequestError";

// GET /hauling-requests/:id/route-options
// Only routes whose waste type can collect this request are returned.
export async function fetchHaulingRouteOptions(
  requestId: string,
): Promise<HaulingRouteOption[]> {
  try {
    const { data } = await apiClient.get<HaulingRouteOption[]>(
      `/hauling-requests/${requestId}/route-options`,
    );
    return data;
  } catch (error) {
    throw toHaulingRequestError(error, "Failed to load routes");
  }
}

interface AssignHaulingRouteVariables {
  requestId: string;
  /** Null takes the request off its route. */
  routeId: string | null;
}

// PATCH /hauling-requests/:id/route
export async function assignHaulingRequestRoute({
  requestId,
  routeId,
}: AssignHaulingRouteVariables): Promise<HaulingRequest> {
  try {
    const { data } = await apiClient.patch<HaulingRequest>(
      `/hauling-requests/${requestId}/route`,
      { routeId },
    );
    return data;
  } catch (error) {
    throw toHaulingRequestError(error, "Failed to assign route");
  }
}

export function formatHaulingRouteOption(route: HaulingRouteOption): string {
  const schedule =
    route.routeType === "Paid" && route.collectionDate
      ? `Paid · ${route.collectionDate}`
      : route.collectionDay;

  return [
    route.routeDisplayNumber,
    route.name,
    schedule,
    route.ecoAideName ?? "No eco-aide yet",
  ].join(" · ");
}

// POST /hauling-requests/paid-route
// Creates a one-time Paid route for one request, puts the truck on it, and
// approves the request if it was pending.
export async function createPaidHaulingRoute(
  input: CreatePaidHaulingRouteInput,
): Promise<Route> {
  try {
    const { data } = await apiClient.post<Route>(
      "/hauling-requests/paid-route",
      input,
    );
    return data;
  } catch (error) {
    throw toHaulingRequestError(error, "Failed to create the paid route");
  }
}
