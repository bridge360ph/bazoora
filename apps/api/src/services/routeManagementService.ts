import { prisma } from "@bazoora/db";
import { Prisma } from "@prisma/client";
import type { Route } from "@prisma/client";
import type { RouteStatus, RouteStopLocation } from "@bazoora/shared";
import { nearestBranch } from "../lib/branches.js";
import { getNextSequence } from "../lib/counter.js";
import { mapRouteToResponse } from "../lib/routeManagementMapper.js";
import { routeAssignmentInclude } from "../lib/routeIncludes.js";
import { generateRouteNumber } from "../lib/displayId.js";
import { truckCarries } from "../lib/truckWasteTypes.js";

type CreateRouteInput = Pick<
  Route,
  | "name"
  | "barangay"
  | "waypoints"
  | "wasteType"
  | "collectionDay"
  | "startTime"
  | "routeType"
> &
  Partial<Pick<Route, "assignedEcoAideId" | "startBranchId">> & {
    stopLocations?: RouteStopLocation[];
    /** YYYY-MM-DD; required for Paid routes, ignored for Free ones. */
    collectionDate?: string | null;
  };

type UpdateRouteInput = Partial<
  Pick<
    Route,
    | "name"
    | "barangay"
    | "waypoints"
    | "wasteType"
    | "collectionDay"
    | "startTime"
    | "routeType"
    | "assignedEcoAideId"
    | "startBranchId"
  >
> & {
  stopLocations?: RouteStopLocation[];
  collectionDate?: string | null;
};

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** "2026-11-12" as a Date at midnight UTC, which stores the calendar day. */
function parseCollectionDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime())) {
    throw new Error("Collection date must be a valid date (YYYY-MM-DD)");
  }

  return date;
}

/**
 * Free routes run every week on collectionDay and have no collection date.
 * Paid routes run once on collectionDate; their collectionDay is set to that
 * date's weekday so pages that read the weekday stay correct.
 */
function resolveRouteSchedule(
  routeType: string,
  collectionDate: string | null | undefined,
  collectionDay: string | undefined,
): { collectionDate: Date | null; collectionDay?: string } {
  if (routeType !== "Paid") {
    return {
      collectionDate: null,
      ...(collectionDay !== undefined && { collectionDay }),
    };
  }

  if (!collectionDate) {
    throw new Error("Collection date is required for paid routes");
  }

  const date = parseCollectionDate(collectionDate);

  return {
    collectionDate: date,
    collectionDay: WEEKDAYS[date.getUTCDay()] ?? "Monday",
  };
}

/**
 * Thrown when a weekly route would share its barangay, collection day and
 * start time with another weekly route. The route handlers answer 409.
 */
export class RouteScheduleClashError extends Error {}

function normalizeBarangay(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/** "7:00" and "07:00" are the same start time. */
function normalizeTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  return match ? `${match[1]?.padStart(2, "0")}:${match[2]}` : value.trim();
}

/**
 * Weekly (Free) routes in one barangay with the same waste type cannot run
 * on the same day at the same start time. Paid routes are one-time and are
 * not checked.
 */
async function assertNoScheduleClash(
  slot: {
    barangay: string;
    wasteType: string;
    collectionDay: string;
    startTime: string;
  },
  excludeRouteId?: string,
) {
  const sameDay = await prisma.route.findMany({
    where: {
      routeType: { not: "Paid" },
      wasteType: slot.wasteType,
      collectionDay: slot.collectionDay,
      ...(excludeRouteId && { id: { not: excludeRouteId } }),
    },
    select: {
      routeNumber: true,
      name: true,
      barangay: true,
      startTime: true,
    },
  });

  const clash = sameDay.find(
    (route) =>
      normalizeBarangay(route.barangay) === normalizeBarangay(slot.barangay) &&
      normalizeTime(route.startTime) === normalizeTime(slot.startTime),
  );

  if (clash) {
    throw new RouteScheduleClashError(
      `This barangay already has a route for this waste type every ${slot.collectionDay} at this time (${generateRouteNumber(clash.routeNumber)} ${clash.name}). Change the waste type, collection day or start time.`,
    );
  }
}

export type RouteCreatedHook = (
  tx: Prisma.TransactionClient,
  route: Route,
) => Promise<void>;

/**
 * Builds the comma separated waypoints text from map-placed stops, so pages
 * that still read `waypoints` keep working. Commas inside a stop name would
 * split it into two stops, so they are replaced.
 */
function waypointsFromStops(stops: RouteStopLocation[]): string {
  return stops
    .map((stop) => stop.name.replace(/,/g, " ").replace(/\s+/g, " ").trim())
    .join(", ");
}

function toJson(stops: RouteStopLocation[]): Prisma.InputJsonValue {
  return stops as unknown as Prisma.InputJsonValue;
}


function validateRouteFields(
  data: Partial<Omit<CreateRouteInput, "collectionDate" | "stopLocations">>,
) {
  const minLengthFields = [
    {
      value: data.name,
      label: "Route name",
    },
    {
      value: data.barangay,
      label: "Barangay",
    },
  ];

  for (const field of minLengthFields) {
    if (
      field.value !== undefined &&
      field.value.trim().length < 5
    ) {
      throw new Error(
        `${field.label} must be at least 5 characters`,
      );
    }
  }

  if (
    data.startTime !== undefined &&
    !data.startTime.trim()
  ) {
    throw new Error(
      "Start time is required",
    );
  }

  if (
    data.routeType !== undefined &&
    !data.routeType.trim()
  ) {
    throw new Error(
      "Route type is required",
    );
  }

  if (data.waypoints !== undefined) {
    getStopCount(data.waypoints);
  }
}


function getStopCount(waypoints: string): number {
  const stops = waypoints
    .split(",")
    .map((stop) => stop.trim())
    .filter(Boolean);

  if (stops.length < 1) {
    throw new Error(
      "At least one collection point is required",
    );
  }

  return stops.length;
}

export async function getRoutes() {
  const routes = await prisma.route.findMany({
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        routeNumber: "desc",
      },
    ],
    include: routeAssignmentInclude,
  });

  return routes.map(mapRouteToResponse);
}

/**
 * Resolves who is allowed to operate a route, in one query.
 *
 * An eco-aide owns a route directly. A driver owns it through the truck
 * assigned to the route, because Route has no driver column of its own.
 * Returns null when the route does not exist.
 */
export async function getRouteAssignment(id: string) {
  const route = await prisma.route.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      assignedEcoAideId: true,
      assignedTruck: {
        select: {
          assignedDriverId: true,
        },
      },
    },
  });

  if (!route) {
    return null;
  }

  return {
    id: route.id,
    assignedEcoAideId: route.assignedEcoAideId,
    assignedDriverId: route.assignedTruck?.assignedDriverId ?? null,
  };
}

/**
 * The route the signed-in operational user is currently on.
 *
 * An eco-aide is assigned to a route directly. A driver reaches one through
 * the truck assigned to them, because Route has no driver column. Taking the
 * subject from the token rather than a path parameter means there is no id for
 * a caller to guess at.
 */
export async function getRouteForUser(userId: string, role: string) {
  if (role === "ECO_AIDE") {
    const route = await prisma.route.findFirst({
      where: {
        assignedEcoAideId: userId,
      },
      include: routeAssignmentInclude,
    });

    return route ? mapRouteToResponse(route) : null;
  }

  if (role === "DRIVER") {
    const route = await prisma.route.findFirst({
      where: {
        assignedTruck: {
          assignedDriverId: userId,
        },
      },
      include: routeAssignmentInclude,
    });

    return route ? mapRouteToResponse(route) : null;
  }

  return null;
}

export async function getRouteById(id: string) {
  const route = await prisma.route.findUnique({
    where: {
      id,
    },
    include: routeAssignmentInclude,
  });

  if (!route) {
    return null;
  }

  return mapRouteToResponse(route);
}


/**
 * `onCreated` runs inside the same transaction as the insert, so work that
 * must succeed together with the new route (such as linking hauling
 * requests to it) is rolled back with it on failure.
 */
export async function createRoute(
  input: CreateRouteInput,
  onCreated?: RouteCreatedHook,
) {
  const { stopLocations, collectionDate, ...rest } = input;
  const schedule = resolveRouteSchedule(
    rest.routeType,
    collectionDate,
    rest.collectionDay,
  );
  const fields = { ...rest, ...schedule };
  const data = stopLocations?.length
    ? { ...fields, waypoints: waypointsFromStops(stopLocations) }
    : fields;

  validateRouteFields(data);

  if (data.routeType !== "Paid") {
    await assertNoScheduleClash(data);
  }

  const duplicateRoute = await prisma.route.findFirst({
    where: {
      name: data.name,
      barangay: data.barangay,
    },
  });

  if (duplicateRoute) {
    // Reuses the same "not found"-style null return as a missing route.
    // If the route handler ever needs to tell these apart in the response
    // (e.g. a specific "route already exists" message), this is the place
    // to throw a distinct error instead.
    return null;
  }

  const stopCount = getStopCount(
    data.waypoints,
  );

  // routeNumber is unique, so it is issued by the shared counter in the same
  // transaction as the insert. Deriving it from a row count would hand the
  // same number to two concurrent creates, and would reissue a used number
  // once any route is deleted.
  const route = await prisma.$transaction(
    async (tx) => {
      const routeNumber = await getNextSequence(
        tx,
        "route",
      );

      const created = await tx.route.create({
        data: {
          ...data,
          // Without a branch, the route is run from the branch nearest its stops.
          startBranchId: data.startBranchId ?? nearestBranch(stopLocations ?? []),
          ...(stopLocations?.length && {
            stopLocations: toJson(stopLocations),
          }),
          routeNumber,
          status: "Not Started",
          stops: stopCount,
        },
        include: routeAssignmentInclude,
      });

      if (onCreated) {
        await onCreated(tx, created);
      }

      return created;
    },
  );

  return mapRouteToResponse(route);
}


export async function updateRoute(
  id: string,
  input: UpdateRouteInput,
) {
  const { stopLocations, collectionDate, ...rest } = input;

  const existingRoute =
    await prisma.route.findUnique({
      where: {
        id,
      },
    });

  if (!existingRoute) {
    return null;
  }

  // Re-check the schedule against the route's current values for any field
  // the request leaves out, so switching Free/Paid stays consistent.
  const scheduleTouched =
    rest.routeType !== undefined ||
    collectionDate !== undefined ||
    rest.collectionDay !== undefined;
  const schedule = scheduleTouched
    ? resolveRouteSchedule(
        rest.routeType ?? existingRoute.routeType,
        collectionDate !== undefined
          ? collectionDate
          : existingRoute.collectionDate?.toISOString().slice(0, 10),
        rest.collectionDay ?? existingRoute.collectionDay,
      )
    : null;

  const fields = schedule ? { ...rest, ...schedule } : rest;
  const data = stopLocations?.length
    ? { ...fields, waypoints: waypointsFromStops(stopLocations) }
    : fields;

  validateRouteFields(data);

  const finalRoute = {
    routeType: data.routeType ?? existingRoute.routeType,
    barangay: data.barangay ?? existingRoute.barangay,
    wasteType: data.wasteType ?? existingRoute.wasteType,
    collectionDay: data.collectionDay ?? existingRoute.collectionDay,
    startTime: data.startTime ?? existingRoute.startTime,
  };
  const slotTouched =
    data.routeType !== undefined ||
    data.barangay !== undefined ||
    data.wasteType !== undefined ||
    data.collectionDay !== undefined ||
    data.startTime !== undefined;

  if (slotTouched && finalRoute.routeType !== "Paid") {
    await assertNoScheduleClash(finalRoute, id);
  }

  // A truck that does not carry the route's new waste type is taken off
  // the route. The form then assigns the truck the admin picked for it.
  let removeTruck = false;

  if (
    data.wasteType !== undefined &&
    data.wasteType !== existingRoute.wasteType &&
    existingRoute.assignedTruckId
  ) {
    const truck = await prisma.truck.findUnique({
      where: { id: existingRoute.assignedTruckId },
      select: { wasteType: true },
    });

    removeTruck = truck !== null && !truckCarries(truck, data.wasteType);
  }

  const route =
    await prisma.route.update({
      where: {
        id,
      },
      data: {
        ...(data.name !== undefined && {
          name: data.name,
        }),
        ...(data.barangay !== undefined && {
          barangay: data.barangay,
        }),
        ...(data.waypoints !== undefined && {
          waypoints: data.waypoints,
          stops: getStopCount(
            data.waypoints,
          ),
          // New stops replace the saved positions. Waypoints edited as plain
          // text no longer match the old positions, so those are cleared and
          // the pages fall back to looking the names up.
          stopLocations: stopLocations?.length
            ? toJson(stopLocations)
            : Prisma.DbNull,
        }),
        ...(data.wasteType !== undefined && {
          wasteType: data.wasteType,
        }),
        ...(data.collectionDay !== undefined && {
          collectionDay: data.collectionDay,
        }),
        ...(data.startTime !== undefined && {
          startTime: data.startTime,
        }),
        ...(data.routeType !== undefined && {
          routeType: data.routeType,
        }),
        ...(schedule && {
          collectionDate: schedule.collectionDate,
        }),
        ...(data.assignedEcoAideId !== undefined && {
          assignedEcoAideId: data.assignedEcoAideId,
        }),
        // An explicit value, null included, replaces the branch. Null with new
        // stops falls back to the branch nearest them, since a route with
        // stops always has a nearest branch. Left out, a route with no branch
        // takes the branch nearest its new stops.
        ...(data.startBranchId !== undefined
          ? {
              startBranchId:
                data.startBranchId ?? (stopLocations?.length ? nearestBranch(stopLocations) : null),
            }
          : !existingRoute.startBranchId && stopLocations?.length
            ? { startBranchId: nearestBranch(stopLocations) }
            : {}),
        ...(removeTruck && { assignedTruckId: null }),
      },
      include: routeAssignmentInclude,
    });

  return mapRouteToResponse(route);
}


export async function updateRouteStatus(
  id: string,
  status: RouteStatus,
) {
  const existingRoute =
    await prisma.route.findUnique({
      where: {
        id,
      },
    });

  if (!existingRoute) {
    return null;
  }

  const route =
    await prisma.route.update({
      where: {
        id,
      },
      data: {
        status,
      },
      include: routeAssignmentInclude,
    });

  return mapRouteToResponse(route);
}

export type DeleteRouteResult = "deleted" | "not_found" | "in_progress";

/**
 * Deletes a route. A route that is in progress is refused so a collection
 * that is happening is never removed from under its driver and eco-aide.
 * The assigned truck and eco-aide are freed automatically because the
 * columns live on Route. Incident reports and hauling requests keep their
 * data with the route link cleared (both foreign keys are ON DELETE SET
 * NULL), so approved requests go back to "no route yet".
 */
export async function deleteRoute(
  id: string,
): Promise<DeleteRouteResult> {
  const route = await prisma.route.findUnique({
    where: {
      id,
    },
    select: {
      status: true,
    },
  });

  if (!route) {
    return "not_found";
  }

  if (route.status === "In Progress") {
    return "in_progress";
  }

  await prisma.route.delete({
    where: {
      id,
    },
  });

  return "deleted";
}
