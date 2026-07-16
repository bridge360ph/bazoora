import { mapRouteToResponse } from "../lib/routeManagementMapper.js";

// Mock-in memory
const routes: Route[] = [];

interface Route {
  id: string;
  routeNumber: string;
  name: string;
  barangay: string;
  waypoints: string;
  wasteType: string;
  collectionDay: string;
  startTime: string;
  status: string;
}

export function getRoutes() {
  return routes.map(mapRouteToResponse);
}

export function getRouteById(id: string) {
  const route = routes.find(
    (route) => route.id === id,
  );

  if (!route) {
    throw new Error("Route not found");
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
    throw new Error("Route already exists");
  }

  const nextRouteNumber = routes.length + 1;

  const route = {
    id: crypto.randomUUID(),
    routeNumber: `RT-${String(
      nextRouteNumber,
    ).padStart(3, "0")}`,
    status: "Not Started",
    ...data,
  };

  routes.push(route);

  return mapRouteToResponse(route);
}


export function updateRoute(
  id: string,
  data: Partial<Route>,
) {
  const route = routes.find(
    (route) => route.id === id,
  );

  if (!route) {
    throw new Error("Route not found");
  }

  Object.assign(route, data);

  return mapRouteToResponse(route);
}