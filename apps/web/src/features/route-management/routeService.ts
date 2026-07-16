import type { Route, RouteFormValue } from "./route.types";
import { INITIAL_ROUTES } from "./route.mockData";

/**
 * Simulated backend for Route Management.
 *
 * This module is the ONLY place that should know whether route data comes
 * from a mock array or a real API. Everything else (hooks, page, components)
 * talks to the functions below, not to the data itself.
 *
 * TODO(backend): once `/api/routes` exists, replace the bodies of these
 * functions with real `fetch` calls (or a generated API client) and delete
 * the in-memory store. No other file in route-management/ should need to
 * change.
 */

const SIMULATED_LATENCY_MS = 300;

// In-memory "database" standing in for a real API. Module-scoped so it
// persists across hook calls within a session.
let routesStore: Route[] = [...INITIAL_ROUTES];

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), SIMULATED_LATENCY_MS);
  });
}

function normalizeEcoAideName(value: string) {
  return value.split(" (")[0];
}

function getStopCount(waypoints: string) {
  return (
    waypoints
      .split(",")
      .map((waypoint) => waypoint.trim())
      .filter(Boolean).length || 1
  );
}

export async function fetchRoutes(): Promise<Route[]> {
  return delay([...routesStore]);
}

export async function createRouteRequest(
  formValue: RouteFormValue,
): Promise<Route> {
  const nextRouteNumber = routesStore.length + 1;

  const nextRoute: Route = {
    id: `RT-${String(nextRouteNumber).padStart(3, "0")}`,
    routeNumber: nextRouteNumber,
    name: formValue.name.trim() || "New Route",
    barangay: formValue.barangay.trim() || "Unassigned Barangay",
    waypoints: formValue.waypoints.trim() || "TBD",
    wasteType: formValue.wasteType,
    collectionDay: formValue.collectionDay,
    startTime: formValue.startTime.trim() || "TBD",
    ecoAide: normalizeEcoAideName(formValue.ecoAide),
    fleetAssignment: formValue.fleetAssignment,
    status: "Not Started",
    stops: getStopCount(formValue.waypoints),
    routeType: formValue.routeType,
  };

  routesStore = [nextRoute, ...routesStore];
  return delay(nextRoute);
}

export async function updateRouteRequest(
  routeId: string,
  formValue: RouteFormValue,
): Promise<Route> {
  let updatedRoute: Route | undefined;

  routesStore = routesStore.map((route) => {
    if (route.id !== routeId) {
      return route;
    }

    updatedRoute = {
      ...route,
      name: formValue.name.trim() || route.name,
      barangay: formValue.barangay.trim() || route.barangay,
      waypoints: formValue.waypoints.trim() || route.waypoints,
      wasteType: formValue.wasteType,
      collectionDay: formValue.collectionDay,
      startTime: formValue.startTime.trim() || route.startTime,
      ecoAide: normalizeEcoAideName(formValue.ecoAide),
      fleetAssignment: formValue.fleetAssignment,
      routeType: formValue.routeType,
      stops: getStopCount(formValue.waypoints),
    };

    return updatedRoute;
  });

  if (!updatedRoute) {
    throw new Error(`Route ${routeId} not found`);
  }

  return delay(updatedRoute);
}

export async function assignRouteEcoAideRequest(
  routeId: string,
  ecoAide: string,
): Promise<Route> {
  let updatedRoute: Route | undefined;

  routesStore = routesStore.map((route) => {
    if (route.id !== routeId) {
      return route;
    }

    updatedRoute = {
      ...route,
      ecoAide: normalizeEcoAideName(ecoAide),
    };

    return updatedRoute;
  });

  if (!updatedRoute) {
    throw new Error(`Route ${routeId} not found`);
  }

  return delay(updatedRoute);
}
