import type { Prisma } from "@prisma/client";
import type { RouteStopLocation } from "@bazoora/shared";
import { generateRouteNumber } from "../lib/displayId.js";
import { routeAssignmentInclude } from "./routeIncludes.js";

type RouteWithRelations = Prisma.RouteGetPayload<{
  include: typeof routeAssignmentInclude;
}>;

export function mapRouteToResponse(route: RouteWithRelations) {
  return {
    ...route,
    routeDisplayNumber: generateRouteNumber(route.routeNumber),
    // Stored as JSON; the route schema validates the shape on every write.
    stopLocations: (route.stopLocations ?? null) as RouteStopLocation[] | null,
  };
}
