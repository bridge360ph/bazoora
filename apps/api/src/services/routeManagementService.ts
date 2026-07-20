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

  const route = await prisma.route.create({
    data: {
      routeNumber: routeCount + 1,
      status: "Not Started",
      stops: 0,
      ...data,
    },
  });

  return mapRouteToResponse(route);
}


export async function updateRoute(
  id: string,
  data: UpdateRouteInput,
) {
  const existingRoute = await prisma.route.findUnique({
      where: {
        id,
      },
    });

  if (!existingRoute) {
    throw new Error(
      "Route not found",
    );
  }

  const route =
    await prisma.route.update({
      where: {
        id,
      },
      data,
    });

  return mapRouteToResponse(route);
}