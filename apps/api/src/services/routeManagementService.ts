import type { RouteStatus } from "@bazoora/shared";
import { mapRouteToResponse } from "../lib/routeManagementMapper.js";

// Mock-in memory
const routes: Route[] = [];

interface Route {
  id: string;
  routeNumber: number;
  name: string;
  barangay: string;
  waypoints: string;
  wasteType: string;
  collectionDay: string;
  startTime: string;
  status: RouteStatus;
}

export function getRoutes() {
  return routes.map(mapRouteToResponse);
}

export function getRouteById(id: string) {
  const route = routes.find(
    (route) => route.id === id,
  );

  if (!route) {
    return null;
  }

  return mapRouteToResponse(route);
}


export function createRoute(
  data: Omit<Route, "id" | "routeNumber" | "status">,
) {
  const duplicateRoute = routes.find(
    (route) =>
      route.name === data.name &&
      route.barangay === data.barangay,
  );

  if (duplicateRoute) {
    return null;
  }

  const nextRouteNumber = routes.length + 1;

  const route: Route = {
    ...data,
    id: crypto.randomUUID(),
    routeNumber: nextRouteNumber,
    status: "Not Started",
  };

  routes.push(route);

  return mapRouteToResponse(route);
}


type UpdateRouteData = Omit<
  Partial<Route>,
  "id" | "routeNumber" | "status"
>;


export function updateRoute(
  id: string,
  data: UpdateRouteData,
) {
  const route = routes.find(
    (route) => route.id === id,
  );

  if (!route) {
    return null;
  }

  Object.assign(route, data);

  return mapRouteToResponse(route);
}


export function updateRouteStatus(
  id: string,
  status: RouteStatus,
) {
  const route = routes.find(
    (route) => route.id === id,
  );

  if (!route) {
    return null;
  }

  route.status = status;

  return mapRouteToResponse(route);
}