import type { HaulingWasteType, WasteType } from "@bazoora/shared";

/**
 * Which route waste types can collect each hauling request waste type.
 *
 * Collection is segregated, so a request only goes on a route that carries a
 * matching waste stream. Routes and requests use different waste type lists,
 * which is why this mapping exists. Hazardous waste has no matching route
 * type yet, so every route is allowed and the admin decides.
 */
export const ROUTE_WASTE_TYPES_FOR_HAULING: Record<
  HaulingWasteType,
  readonly WasteType[]
> = {
  BIODEGRADABLE: ["Regular"],
  RESIDUAL: ["Regular", "Regular/Non-Recyclable"],
  NON_BIODEGRADABLE: ["Recyclable", "Regular/Non-Recyclable"],
  HAZARDOUS: ["Regular", "Recyclable", "Regular/Non-Recyclable"],
};

export function canRouteCollectWaste(
  routeWasteType: string,
  requestWasteType: HaulingWasteType,
): boolean {
  return ROUTE_WASTE_TYPES_FOR_HAULING[requestWasteType].includes(
    routeWasteType as WasteType,
  );
}
