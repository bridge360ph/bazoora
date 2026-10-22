import { prisma } from "@bazoora/db";
import type { Route } from "@prisma/client";
import type { RouteStatus } from "@bazoora/shared";
import { getNextSequence } from "../lib/counter.js";
import { mapRouteToResponse } from "../lib/routeManagementMapper.js";
import { routeEcoAideInclude } from "../lib/routeIncludes.js";

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
  Partial<Pick<Route, "assignedEcoAideId">>;

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
  >
>;


function validateRouteFields(
  data: Partial<CreateRouteInput>,
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
    include: routeEcoAideInclude,
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
      include: routeEcoAideInclude,
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
      include: routeEcoAideInclude,
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
    include: routeEcoAideInclude,
  });

  if (!route) {
    return null;
  }

  return mapRouteToResponse(route);
}


export async function createRoute(
  data: CreateRouteInput,
) {
  validateRouteFields(data);

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

      return tx.route.create({
        data: {
          ...data,
          routeNumber,
          status: "Not Started",
          stops: stopCount,
        },
        include: routeEcoAideInclude,
      });
    },
  );

  return mapRouteToResponse(route);
}


export async function updateRoute(
  id: string,
  data: UpdateRouteInput,
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

  validateRouteFields(data);

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
        ...(data.assignedEcoAideId !== undefined && {
          assignedEcoAideId: data.assignedEcoAideId,
        }),
      },
      include: routeEcoAideInclude,
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
      include: routeEcoAideInclude,
    });

  return mapRouteToResponse(route);
}