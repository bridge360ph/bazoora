import type { Route } from "@prisma/client";
import { generateRouteNumber } from "../lib/displayId.js";

/*
 * Future mapper updates:
 *
 * - Format routeNumber for UI:
 *   RT-001, RT-002, etc.
 *
 * - Replace internal IDs with display values:
 *   assignedEcoAideId -> ecoAideName
 *   assignedTruckId -> truckPlateNumber
 *
 * - Map related data from Prisma includes:
 *   assignedEcoAide, assignedTruck
 */

export function mapRouteToResponse(
  route: Route,
) {
  return {
    ...route,
    routeDisplayNumber: generateRouteNumber(route.routeNumber),
  };
}