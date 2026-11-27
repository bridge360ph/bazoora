import type { HaulingWasteType } from "@bazoora/shared";

/**
 * Collection is segregated, so a request only goes on a route that carries
 * the same waste type. Routes and requests share one list of waste types.
 */
export function canRouteCollectWaste(
  routeWasteType: string,
  requestWasteType: HaulingWasteType,
): boolean {
  return routeWasteType === requestWasteType;
}
