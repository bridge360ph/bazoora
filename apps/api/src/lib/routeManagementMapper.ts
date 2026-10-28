import type { Prisma } from "@prisma/client";
import { generateRouteNumber } from "../lib/displayId.js";
import { routeAssignmentInclude } from "./routeIncludes.js";

type RouteWithRelations = Prisma.RouteGetPayload<{
  include: typeof routeAssignmentInclude;
}>;

export function mapRouteToResponse(route: RouteWithRelations) {
  return {
    ...route,
    routeDisplayNumber: generateRouteNumber(route.routeNumber),
  };
}
