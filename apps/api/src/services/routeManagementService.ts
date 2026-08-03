import { prisma } from "@bazoora/db";
import type { Route } from "@prisma/client";
import type { RouteStatus } from "@bazoora/shared";
import { mapRouteToResponse } from "../lib/routeManagementMapper.js";

type CreateRouteInput = Pick<
  Route,
  | "name"
  | "barangay"
  | "waypoints"
  | "wasteType"
  | "collectionDay"
  | "startTime"
  | "routeType"
>;

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
  });

  return routes.map(mapRouteToResponse);
}

export async function getRouteById(id: string) {
  const route = await prisma.route.findUnique({
    where: {
      id,
    },
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

  const routeCount = await prisma.route.count();

  const stopCount = getStopCount(
    data.waypoints,
  );

  const route = await prisma.route.create({
    data: {
      ...data,
      routeNumber: routeCount + 1,
      status: "Not Started",
      stops: stopCount,
    },
  });

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
      },
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
    });

  return mapRouteToResponse(route);
}