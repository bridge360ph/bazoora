import axios from "axios";
import type { HaulingRouteStop, Route } from "@bazoora/shared";

import { apiClient } from "@/lib/api-client";
import { geocode } from "@/lib/geocoding";
import { splitPickupAddresses } from "@/features/residents/components/hauling-requests/utils";

/** A stop built from the driver's assigned route, before it is started. */
export interface AssignedRouteStop {
  id: string;
  number: string;
  name: string;
  detail: string;
  lat: number;
  lng: number;
  status: "pending";
}

// Nominatim asks for at most one request per second; the eco-aide route page
// spaces its lookups the same way.
const GEOCODE_SPACING_MS = 1100;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** The route assigned to the signed-in driver, or null when there is none. */
export async function fetchMyRoute(): Promise<Route | null> {
  try {
    const { data } = await apiClient.get<Route>("/routes/me");
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/** Approved hauling requests on the driver's route scheduled for today. */
export async function fetchMyHaulingStops(): Promise<HaulingRouteStop[]> {
  const { data } = await apiClient.get<HaulingRouteStop[]>(
    "/hauling-requests/my-route-stops",
  );
  return data;
}

async function locate(
  query: string,
  fallbackQuery: string | null,
): Promise<{ lat: number; lng: number } | null> {
  const queries = fallbackQuery ? [query, fallbackQuery] : [query];

  for (const [index, text] of queries.entries()) {
    if (index > 0) {
      await sleep(GEOCODE_SPACING_MS);
    }

    try {
      const [match] = await geocode(text, { limit: 1, countryCodes: "ph" });
      const lat = Number(match?.lat);
      const lng = Number(match?.lon);

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    } catch {
      // Fall through to the next query. Without a match the stop is left out.
    }
  }

  return null;
}

/**
 * Turns the route's waypoints and today's hauling requests into map stops.
 * Waypoints come first in the order the admin entered them, then each pickup
 * address of each hauling request. A place that cannot be found on the map
 * is left out, never given a made-up position, and counted in `unlocated` so
 * the driver is told.
 */
export async function buildAssignedRouteStops(
  route: Route,
  haulingStops: HaulingRouteStop[],
): Promise<{ stops: AssignedRouteStop[]; unlocated: string[] }> {
  const entries: {
    name: string;
    detail: string;
    query: string;
    fallback: string | null;
    position?: { lat: number; lng: number };
  }[] = [];

  // Routes saved with map positions need no lookup at all.
  if (route.stopLocations && route.stopLocations.length > 0) {
    for (const stop of route.stopLocations) {
      entries.push({
        name: stop.name,
        detail: `${route.routeDisplayNumber} · Route stop`,
        query: stop.address,
        fallback: null,
        position: { lat: stop.lat, lng: stop.lng },
      });
    }
  } else {
    for (const waypoint of route.waypoints.split(",").map((stop) => stop.trim()).filter(Boolean)) {
      entries.push({
        name: waypoint,
        detail: `${route.routeDisplayNumber} · Route stop`,
        query: `${waypoint}, ${route.barangay}`,
        fallback: waypoint,
      });
    }
  }

  for (const request of haulingStops) {
    for (const address of splitPickupAddresses(request.requestAddress)) {
      entries.push({
        name: address,
        detail: `Hauling · ${request.requestNumber}`,
        query: address,
        fallback: null,
      });
    }
  }

  const stops: AssignedRouteStop[] = [];
  const unlocated: string[] = [];
  let lookups = 0;

  for (const entry of entries) {
    let position = entry.position ?? null;

    if (!position) {
      if (lookups > 0) {
        await sleep(GEOCODE_SPACING_MS);
      }
      lookups += 1;
      position = await locate(entry.query, entry.fallback);
    }

    if (!position) {
      unlocated.push(entry.name);
      continue;
    }

    const number = stops.length + 1;
    stops.push({
      id: `assigned-${number}`,
      number: String(number).padStart(2, "0"),
      name: entry.name,
      detail: entry.detail,
      lat: position.lat,
      lng: position.lng,
      status: "pending",
    });
  }

  return { stops, unlocated };
}
