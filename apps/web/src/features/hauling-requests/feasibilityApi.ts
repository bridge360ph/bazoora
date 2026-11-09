import type {
  HaulingFeasibilityResult,
  HaulingFeasibilityStatus,
  HaulingRequest,
} from "@bazoora/shared";

import { apiClient } from "@/lib/api-client";
import { geocode } from "@/lib/geocoding";
import { calculateRoute } from "@/lib/routing";
import { planRoute } from "@/lib/routeOptimizer";
import { getPickupAddresses } from "./haulingRequestFormat";
import { toHaulingRequestError } from "./haulingRequestError";

// GET /hauling-requests/:id/feasibility
// Pickup date and free trucks with a driver.
export async function fetchHaulingFeasibility(
  requestId: string,
): Promise<HaulingFeasibilityResult> {
  try {
    const { data } = await apiClient.get<HaulingFeasibilityResult>(
      `/hauling-requests/${requestId}/feasibility`,
    );
    return data;
  } catch (error) {
    throw toHaulingRequestError(error, "Failed to check the request");
  }
}

/** A pickup stop of the request, with its map position when it was found. */
export interface LocatedPickup {
  address: string;
  lat: number | null;
  lng: number | null;
}

export interface PickupPathCheck {
  status: HaulingFeasibilityStatus;
  message: string;
  /** The stops in the resident's order, used to start a Paid route. */
  stops: LocatedPickup[];
}

// Nominatim asks for at most one request per second.
const GEOCODE_SPACING_MS = 1100;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * The request's pickup stops with map positions. Requests made since stops
 * are saved with their positions need no lookup. Older ones are looked up
 * by address.
 */
async function locatePickups(request: HaulingRequest): Promise<LocatedPickup[]> {
  if (request.pickupLocations && request.pickupLocations.length > 0) {
    return request.pickupLocations.map((stop) => ({ ...stop }));
  }

  const located: LocatedPickup[] = [];

  for (const [index, address] of getPickupAddresses(request.requestAddress).entries()) {
    if (index > 0) await sleep(GEOCODE_SPACING_MS);

    try {
      const [match] = await geocode(address, { limit: 1, countryCodes: "ph" });
      located.push({
        address,
        lat: match ? Number(match.lat) : null,
        lng: match ? Number(match.lon) : null,
      });
    } catch {
      located.push({ address, lat: null, lng: null });
    }
  }

  return located;
}

function formatKm(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return minutes < 60
    ? `${minutes} min`
    : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/**
 * Checks that every pickup stop is on the map and that a driving path runs
 * from the depot through all of them.
 */
export async function checkPickupPath(request: HaulingRequest): Promise<PickupPathCheck> {
  const stops = await locatePickups(request);
  const missing = stops.filter((stop) => stop.lat === null || stop.lng === null);

  if (stops.length === 0) {
    return { status: "fail", message: "The request has no pickup address.", stops };
  }

  // A warning, not a failure: the admin can place these stops by hand in the
  // route form, so the request can still be approved.
  if (missing.length > 0) {
    return {
      status: "warn",
      message:
        missing.length === 1 && stops.length === 1
          ? "The pickup address could not be found on the map. Place it by hand when creating the route."
          : `${missing.length} of ${stops.length} pickup addresses could not be found on the map. Place them by hand when creating the route.`,
      stops,
    };
  }

  const points = stops.map((stop) => ({ lat: stop.lat ?? 0, lng: stop.lng ?? 0 }));
  // Start from the nearby branch with the shortest drive through the stops.
  const plan = await planRoute(points, { keepOrder: request.keepStopOrder });

  if (!plan) {
    return { status: "fail", message: "No branch could be chosen for these stops.", stops };
  }

  const ordered = plan.order.flatMap((index) => {
    const point = points[index];
    return point ? [point] : [];
  });

  const route = await calculateRoute([
    [plan.branch.lng, plan.branch.lat],
    ...ordered.map((point) => [point.lng, point.lat] as [number, number]),
  ]);

  // calculateRoute answers with a zero-length straight line when the
  // routing service fails or finds no road path.
  if (route.distance <= 0) {
    return {
      status: "warn",
      message: `Every stop is on the map, but a driving path from ${plan.branch.name} could not be confirmed. The routing service did not answer.`,
      stops,
    };
  }

  return {
    status: "pass",
    message: `About ${formatKm(route.distance)} and ${formatMinutes(route.duration)} from ${plan.branch.name} (nearest branch) through ${
      stops.length === 1 ? "the stop" : `all ${stops.length} stops`
    }.`,
    stops,
  };
}
