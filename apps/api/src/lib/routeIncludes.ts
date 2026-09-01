import type { Prisma } from "@prisma/client";

export const routeEcoAideInclude = {
  assignedEcoAide: {
    select: {
      id: true,
      name: true,
      userNumber: true,
    },
  },
} satisfies Prisma.RouteInclude;


export const routeFleetInclude = {
  assignedTruck: {
    select: {
      id: true,
      truckNumber: true,
      plateNumber: true,
    },
  },
} satisfies Prisma.RouteInclude;


export const routeAssignmentInclude = {
  ...routeEcoAideInclude,
  ...routeFleetInclude,
} satisfies Prisma.RouteInclude;