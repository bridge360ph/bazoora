import type { HaulingRequest, HaulingRouteOption } from "@bazoora/shared";

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
  return [
    route.routeDisplayNumber,
    route.name,
    route.collectionDay,
    route.ecoAideName ?? "No eco-aide yet",
  ].join(" · ");
}
