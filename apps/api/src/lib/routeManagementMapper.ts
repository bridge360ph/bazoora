import type { Prisma } from "@prisma/client";
import { generateRouteNumber } from "../lib/displayId.js";
import { routeEcoAideInclude } from "./routeIncludes.js";

type RouteWithRelations = Prisma.RouteGetPayload<{
  include: typeof routeEcoAideInclude;
}>;

export function mapRouteToResponse(route: RouteWithRelations) {
  return {
    ...route,
    routeDisplayNumber: generateRouteNumber(route.routeNumber),
  };
}