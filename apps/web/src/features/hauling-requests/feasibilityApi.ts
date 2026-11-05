import type {
  AvailablePaidRouteTruck,
  HaulingFeasibilityResult,
  HaulingFeasibilityStatus,
  HaulingRequest,
} from "@bazoora/shared";

import { apiClient } from "@/lib/api-client";
import { geocode } from "@/lib/geocoding";
import { calculateRoute } from "@/lib/routing";
import { planRoute } from "@/lib/routeOptimizer";
import { branchById, haversineMeters, type Branch } from "@/lib/branches";
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
  /**
   * The nearest free truck and its drive to the first pickup. Replaces the
   * API's truck check. Null when there is no free truck to compare.
   */
  truckCheck: { status: HaulingFeasibilityStatus; message: string } | null;
  /** The free truck with the shortest drive, offered first. */
  recommendedTruckId: string | null;
  /** Free truck ids, nearest branch first (straight line to the first stop). */
  truckOrder: string[];
}

/** Drive time limits from the truck's branch to the first pickup. */
export const TRUCK_PASS_MINUTES = 60;
export const TRUCK_WARN_MINUTES = 150;

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

function truckLabel(truck: AvailablePaidRouteTruck): string {
  return truck.truckNumber ? `${truck.truckNumber} (${truck.plateNumber})` : truck.plateNumber;
}

/**
 * Pass, warn or fail by the drive from the nearest free truck's branch to
 * the first pickup: up to 60 minutes passes, up to 150 minutes is a warning
 * the admin can still approve, and anything longer fails.
 */
function judgeTruckDrive(
  truck: AvailablePaidRouteTruck,
  branch: Branch,
  approach: { seconds: number; meters: number },
  estimated: boolean,
): { status: HaulingFeasibilityStatus; message: string } {
  const minutes = approach.seconds / 60;
  const drive = `about ${formatKm(approach.meters)} and ${formatMinutes(approach.seconds)}${
    estimated ? " (estimated)" : ""
  } to the first pickup`;

  if (minutes <= TRUCK_PASS_MINUTES) {
    return {
      status: "pass",
      message: `${truckLabel(truck)} from ${branch.name} is free, ${drive}.`,
    };
  }

  if (minutes <= TRUCK_WARN_MINUTES) {
    return {
      status: "warn",
      message: `No free truck is near the pickup. Nearest free truck: ${truckLabel(truck)} from ${branch.name}, ${drive}.`,
    };
  }

  return {
    status: "fail",
    message: `The nearest free truck, ${truckLabel(truck)} from ${branch.name}, is ${drive}. That is over ${
      TRUCK_WARN_MINUTES / 60
    } hours away.`,
  };
}

/**
 * Checks that every pickup stop is on the map and that a driving path runs
 * to all of them from the branch of the nearest free truck. When `trucks`
 * is empty the nearest branches are compared instead.
 */
export async function checkPickupPath(
  request: HaulingRequest,
  trucks: AvailablePaidRouteTruck[] = [],
): Promise<PickupPathCheck> {
  const stops = await locatePickups(request);
  const missing = stops.filter((stop) => stop.lat === null || stop.lng === null);

  if (stops.length === 0) {
    return {
      status: "fail",
      message: "The request has no pickup address.",
      stops,
      truckCheck: null,
      recommendedTruckId: null,
      truckOrder: trucks.map((truck) => truck.id),
    };
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
      truckCheck: null,
      recommendedTruckId: null,
      truckOrder: trucks.map((truck) => truck.id),
    };
  }

  const points = stops.map((stop) => ({ lat: stop.lat ?? 0, lng: stop.lng ?? 0 }));
  const firstPoint = points[0] ?? { lat: 0, lng: 0 };

  // Free trucks with a known branch, nearest branch first in a straight line.
  const located = trucks
    .flatMap((truck) => {
      const branch = branchById(truck.branchId);
      return branch ? [{ truck, branch, meters: haversineMeters(branch, firstPoint) }] : [];
    })
    .sort((a, b) => a.meters - b.meters);
  const truckBranches = [...new Map(located.map((item) => [item.branch.id, item.branch])).values()];

  // Start from the free truck's branch with the shortest drive through the
  // stops, or from the nearest branches when no truck is free.
  const plan = await planRoute(points, {
    keepOrder: request.keepStopOrder,
    ...(truckBranches.length > 0 && { branches: truckBranches }),
  });

  if (!plan) {
    return {
      status: "fail",
      message: "No branch could be chosen for these stops.",
      stops,
      truckCheck: null,
      recommendedTruckId: null,
      truckOrder: located.map((item) => item.truck.id),
    };
  }

  const recommended = located.find((item) => item.branch.id === plan.branch.id) ?? null;
  const truckCheck = recommended
    ? judgeTruckDrive(recommended.truck, plan.branch, plan.approach, plan.estimated)
    : null;
  const truckOrder = [
    ...(recommended ? [recommended.truck.id] : []),
    ...located.map((item) => item.truck.id).filter((id) => id !== recommended?.truck.id),
  ];
  const fromLabel = recommended ? `${plan.branch.name} (nearest free truck)` : `${plan.branch.name} (nearest branch)`;
  const extras = { truckCheck, recommendedTruckId: recommended?.truck.id ?? null, truckOrder };

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
      ...extras,
    };
  }

  return {
    status: "pass",
    message: `About ${formatKm(route.distance)} and ${formatMinutes(route.duration)} from ${fromLabel} through ${
      stops.length === 1 ? "the stop" : `all ${stops.length} stops`
    }.`,
    stops,
    ...extras,
  };
}
