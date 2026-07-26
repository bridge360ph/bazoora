import { Prisma } from "@prisma/client";
import { prisma } from "@bazoora/db";
import type {
  AssignEcoAideRequest,
  AssignTruckRequest,
  UserSummary,
} from "@bazoora/shared";
import { mapRouteToResponse } from "../lib/routeManagementMapper.js";


/**
 * Lets the route handler map errors to the right HTTP status instead of
 * flattening everything to 400.
 */
export class RouteAssignmentError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "RouteAssignmentError";
    this.statusCode = statusCode;
  }
}


function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}


export async function assignEcoAide(
  routeId: string,
  data: AssignEcoAideRequest,
) {
  const route = await prisma.route.findUnique({
    where: {
      id: routeId,
    },
  });

  if (!route) {
    throw new RouteAssignmentError("Route not found", 404);
  }


  const ecoAide = await prisma.user.findUnique({
    where: {
      id: data.ecoAideId,
    },
    include: {
      assignedRoute: true,
    },
  });


  if (!ecoAide) {
    throw new RouteAssignmentError("Eco-Aide not found", 404);
  }


  if (ecoAide.role !== "ECO_AIDE") {
    throw new RouteAssignmentError("User is not an Eco-Aide", 400);
  }


  if (
    ecoAide.assignedRoute &&
    ecoAide.assignedRoute.id !== routeId
  ) {
    throw new RouteAssignmentError(
      "Eco-Aide is already assigned to another route",
      409,
    );
  }


  try {
    const updatedRoute = await prisma.route.update({
      where: {
        id: routeId,
      },
      data: {
        assignedEcoAideId: data.ecoAideId,
      },
    });

    return mapRouteToResponse(updatedRoute);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new RouteAssignmentError(
        "Eco-Aide is already assigned to another route",
        409,
      );
    }

    throw error;
  }
}


export async function assignTruck(
  routeId: string,
  data: AssignTruckRequest,
) {
  const route = await prisma.route.findUnique({
    where: {
      id: routeId,
    },
  });


  if (!route) {
    throw new RouteAssignmentError("Route not found", 404);
  }


  const truck = await prisma.truck.findUnique({
    where: {
      id: data.truckId,
    },
    include: {
      assignedRoute: true,
    },
  });


  if (!truck) {
    throw new RouteAssignmentError("Truck not found", 404);
  }


  if (
    truck.assignedRoute &&
    truck.assignedRoute.id !== routeId
  ) {
    throw new RouteAssignmentError(
      "Truck is already assigned to another route",
      409,
    );
  }


  try {
    const updatedRoute = await prisma.route.update({
      where: {
        id: routeId,
      },
      data: {
        assignedTruckId: data.truckId,
      },
    });

    return mapRouteToResponse(updatedRoute);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new RouteAssignmentError(
        "Truck is already assigned to another route",
        409,
      );
    }

    throw error;
  }
}


/**
 * Absorbed from the old standalone /users endpoint: returns the minimal
 * fields the Route Assignment dropdowns need for Eco-Aides. Never select
 * email/password — this is an easy place to leak a full User row by
 * accident. UserSummary.name is non-nullable, so a missing name is
 * normalized here rather than left for each consumer to handle.
 */
export async function listEcoAideOptions(): Promise<UserSummary[]> {
  const ecoAides = await prisma.user.findMany({
    where: {
      role: "ECO_AIDE",
    },
    select: {
      id: true,
      name: true,
    },
  });

  return ecoAides.map((ecoAide) => ({
    id: ecoAide.id,
    name: ecoAide.name ?? "Unnamed Eco-Aide",
  }));
}
