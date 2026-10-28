import { Prisma } from "@prisma/client";
import { prisma } from "@bazoora/db";
import type {
  AssignEcoAideRequest,
  AssignTruckRequest,
  RouteTruckOption,
  UserSummary
} from "@bazoora/shared";
import { mapRouteToResponse } from "../lib/routeManagementMapper.js";
import { routeAssignmentInclude } from "../lib/routeIncludes.js";

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
    throw new RouteAssignmentError(
      "The selected route could not be found.",
      404,
    );
  }


  if (data.ecoAideId) {
    const ecoAide = await prisma.user.findUnique({
      where: {
        id: data.ecoAideId,
      },
      select: {
        id: true,
        role: true,
        ecoAideProfile: {
          select: {
            status: true,
            archivedAt: true,
          },
        },
        assignedRoute: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!ecoAide) {
      throw new RouteAssignmentError(
        "The selected Eco-Aide could not be found.",
        404,
      );
    }

    if (ecoAide.role !== "ECO_AIDE") {
      throw new RouteAssignmentError(
        "The selected user is not an Eco-Aide.",
        400,
      );
    }
    if (
      !ecoAide.ecoAideProfile ||
      ecoAide.ecoAideProfile.archivedAt ||
      ecoAide.ecoAideProfile.status !== "ACTIVE"
    ) {
      throw new RouteAssignmentError(
        "The selected Eco-Aide is not active and cannot be assigned.",
        409,
      );
    }


    if (
      ecoAide.assignedRoute &&
      ecoAide.assignedRoute.id !== routeId
    ) {
      throw new RouteAssignmentError(
        "This Eco-Aide is already assigned to another route.",
        409,
      );
    }
  }

  try {
    const updatedRoute = await prisma.route.update({
      where: {
        id: routeId,
      },
      data: {
        assignedEcoAideId: data.ecoAideId,
      },
      include: routeAssignmentInclude,
    });

    return mapRouteToResponse(updatedRoute);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new RouteAssignmentError(
        "This Eco-Aide is already assigned to another route.",
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
      userNumber: {
        not: null,          // only show eco-aides with IDs
      },
      ecoAideProfile: {
        is: {
          status: "ACTIVE",
          archivedAt: null,
        },
      },
    },
    select: {
      id: true,
      userNumber: true,
      name: true,
    },
  });

  return ecoAides.map((ecoAide) => ({
    id: ecoAide.id,
    userNumber: ecoAide.userNumber ?? "N/A",
    name: ecoAide.name ?? "Unnamed Eco-Aide",
  }));
}

/**
 * Puts a truck on a route, or takes it off when truckId is null.
 *
 * Route.assignedTruckId is unique, so a truck can serve one route at a time.
 * A truck already on another route is refused rather than moved, so an admin
 * never takes a truck away from a route without seeing it.
 */
export async function assignTruck(
  routeId: string,
  data: AssignTruckRequest,
) {
  const route = await prisma.route.findUnique({
    where: {
      id: routeId,
    },
    select: {
      id: true,
    },
  });

  if (!route) {
    throw new RouteAssignmentError(
      "The selected route could not be found.",
      404,
    );
  }

  if (data.truckId) {
    const truck = await prisma.truck.findUnique({
      where: {
        id: data.truckId,
      },
      select: {
        id: true,
        assignedRoute: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!truck) {
      throw new RouteAssignmentError(
        "The selected truck could not be found.",
        404,
      );
    }

    if (truck.assignedRoute && truck.assignedRoute.id !== routeId) {
      throw new RouteAssignmentError(
        `This truck is already assigned to ${truck.assignedRoute.name}.`,
        409,
      );
    }
  }

  try {
    const updatedRoute = await prisma.route.update({
      where: {
        id: routeId,
      },
      data: {
        assignedTruckId: data.truckId,
      },
      include: routeAssignmentInclude,
    });

    return mapRouteToResponse(updatedRoute);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new RouteAssignmentError(
        "This truck is already assigned to another route.",
        409,
      );
    }

    throw error;
  }
}

/**
 * Trucks for the route Assign Truck dropdown. Trucks on other routes are
 * included with their assignedRouteId so the UI can leave them out while
 * still showing the current route's own truck as selected.
 */
export async function listTruckOptions(): Promise<RouteTruckOption[]> {
  const trucks = await prisma.truck.findMany({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      truckNumber: true,
      plateNumber: true,
      status: true,
      assignedRoute: {
        select: {
          id: true,
        },
      },
    },
  });

  return trucks.map((truck) => ({
    id: truck.id,
    truckNumber: truck.truckNumber,
    plateNumber: truck.plateNumber,
    status: truck.status,
    assignedRouteId: truck.assignedRoute?.id ?? null,
  }));
}
