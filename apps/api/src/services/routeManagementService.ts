import { prisma } from "@bazoora/db";
import type { Route } from "@prisma/client";
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
    | "status"
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
    orderBy: {
      routeNumber: "asc",
    },
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
    throw new Error("Route not found");
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
    throw new Error("Route already exists");
  }

  const routeCount = await prisma.route.count();

  const stopCount = getStopCount(
    data.waypoints,
  );

  const route = await prisma.route.create({
    data: {
      routeNumber: routeCount + 1,
      status: "Not Started",
      stops: stopCount,
      ...data,
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
    throw new Error(
      "Route not found",
    );
  }

  validateRouteFields(data);

  const route =
    await prisma.route.update({
      where: {
        id,
      },
      data: {
        ...data,
        ...(data.waypoints !== undefined && {
          stops: getStopCount(
            data.waypoints,
          ),
        }),
      },
    });

  return mapRouteToResponse(
    route,
  );
}