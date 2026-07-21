import { prisma } from "@bazoora/db";
import { mapRouteToResponse } from "../lib/routeManagementMapper.js";

interface AssignEcoAideInput {
  ecoAideId: string;
}

interface AssignTruckInput {
  truckId: string;
}

export async function assignEcoAide(
  routeId: string,
  data: AssignEcoAideInput,
) {
  const route = await prisma.route.findUnique({
    where: {
      id: routeId,
    },
  });

  if (!route) {
    throw new Error("Route not found");
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
    throw new Error("Eco-Aide not found");
  }

  if (ecoAide.role !== "ECO_AIDE") {
    throw new Error("User is not an Eco-Aide");
  }

  if (
    ecoAide.assignedRoute &&
    ecoAide.assignedRoute.id !== routeId
  ) {
    throw new Error(
      "Eco-Aide is already assigned to another route",
    );
  }

  const updatedRoute = await prisma.route.update({
    where: {
      id: routeId,
    },
    data: {
      assignedEcoAideId: data.ecoAideId,
    },
  });

  return mapRouteToResponse(updatedRoute);
}


export async function assignTruck(
  routeId: string,
  data: AssignTruckInput,
) {
  const route = await prisma.route.findUnique({
    where: {
      id: routeId,
    },
  });

  if (!route) {
    throw new Error("Route not found");
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
    throw new Error("Truck not found");
  }

  if (
    truck.assignedRoute &&
    truck.assignedRoute.id !== routeId
  ) {
    throw new Error(
      "Truck is already assigned to another route",
    );
  }

  const updatedRoute = await prisma.route.update({
    where: {
      id: routeId,
    },
    data: {
      assignedTruckId: data.truckId,
    },
  });

  return mapRouteToResponse(updatedRoute);
}