import type { FastifyPluginCallback } from "fastify";
import { routeBranchId } from "../lib/branches.js";
import { prisma } from "@bazoora/db";
import { authGuard, requireRole } from "../lib/auth.js";
import type { Prisma } from "@bazoora/db";
import { getNextSequence } from "../lib/counter.js";
import { generateRouteNumber, generateTruckNumber } from "../lib/displayId.js";
import {
  branchIdSchema,
  branchMismatchReason,
  toWasteType,
  truckCarries,
  wasteTypeLabel,
  wasteTypeMismatchMessage,
  wasteTypeSchema,
} from "../lib/truckWasteTypes.js";

type TruckInput = {
  plateNumber: string;
  model: string;
  capacity: string;
  status: "Active" | "Idle" | "Under Maintenance";
  assignedDriverId?: string;
  branchId: string;
  wasteType: string;
};

type TruckWithRelations = Prisma.TruckGetPayload<{
  include: {
    assignedDriver: true;
    assignedRoute: {
      include: {
        assignedEcoAide: true;
      };
    };
  };
}>;

/** A check made inside a transaction that refuses the change (409). */
class FleetConflictError extends Error {}

/**
 * Checks and writes run in one serializable transaction, so a route or truck
 * changed by someone else in between makes the transaction fail (P2034)
 * instead of saving a truck that no longer matches its route.
 */
const SERIALIZABLE = { isolationLevel: "Serializable" } as const;

const CONCURRENT_CHANGE_MESSAGE =
  "The truck or route was changed by someone else at the same time. Please try again.";

function getPrismaErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return undefined;
}

function formatTruck(truck: TruckWithRelations) {
  const route = truck.assignedRoute;

  return {
    databaseId: truck.id,
    id: truck.truckNumber ?? "Pending ID",
    plateNumber: truck.plateNumber,
    model: truck.model ?? "",
    capacity: truck.capacity ?? "",
    status: truck.status,
    branchId: truck.branchId,
    wasteType: toWasteType(truck.wasteType),
    assignedDriver: truck.assignedDriver?.name ?? "Unassigned",
    assignedDriverId: truck.assignedDriverId ?? undefined,
    registeredDate: truck.createdAt.toLocaleDateString("en-GB"),
    assignedRoute: route?.name ?? undefined,
    assignedRouteId: route?.id ?? undefined,
    assignedEcoAide: route?.assignedEcoAide?.name ?? undefined,
    assignedEcoAideId: route?.assignedEcoAideId ?? undefined,
  };
}

const truckInclude = {
  assignedDriver: true,
  assignedRoute: {
    include: {
      assignedEcoAide: true,
    },
  },
} as const;

// Truck.status is a plain String column whose legal values live only in a
// schema comment, so the enum has to be enforced here. Without it any string
// persists and that truck then falls out of every status bucket in the fleet
// cards and the analytics pie.
const truckBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["plateNumber", "model", "capacity", "status", "branchId", "wasteType"],
  properties: {
    plateNumber: { type: "string", minLength: 1, maxLength: 20 },
    model: { type: "string", minLength: 1, maxLength: 100 },
    capacity: { type: "string", minLength: 1, maxLength: 50 },
    status: {
      type: "string",
      enum: ["Active", "Idle", "Under Maintenance"],
    },
    assignedDriverId: { type: ["string", "null"] },
    branchId: branchIdSchema,
    wasteType: wasteTypeSchema,
  },
} as const;

const truckParamsSchema = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string" } },
} as const;

const truckAssignmentBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["routeId"],
  properties: {
    routeId: { type: "string", minLength: 1 },
    // Optional until Eco-Aide assignment is ready.
    ecoAideId: { type: ["string", "null"] },
  },
} as const;

export const adminFleetRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.addHook("preHandler", authGuard);
  app.addHook(
    "preHandler",
    requireRole("SUPER_ADMIN", "GOVERNMENT_ADMIN", "HAULING_ADMIN"),
  );
  app.get("/", async () => {
    const trucksWithoutNumbers = await prisma.truck.findMany({
      where: { truckNumber: null },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    for (const truck of trucksWithoutNumbers) {
      await prisma.$transaction(async (tx) => {
        const sequence = await getNextSequence(tx, "truck");

        await tx.truck.update({
          where: { id: truck.id },
          data: {
            truckNumber: generateTruckNumber(sequence),
          },
        });
      });
    }

    const trucks = await prisma.truck.findMany({
      include: truckInclude,
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: trucks.map(formatTruck),
    };
  });

  // Every driver account with the truck assigned to them, if any, and the
  // route that truck is on.
  app.get("/drivers", async () => {
    const drivers = await prisma.user.findMany({
      where: { role: "DRIVER" },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: {
        id: true,
        userNumber: true,
        name: true,
        email: true,
        createdAt: true,
        assignedTruck: {
          select: {
            id: true,
            truckNumber: true,
            plateNumber: true,
            status: true,
            branchId: true,
            assignedRoute: {
              select: {
                routeNumber: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: drivers.map((driver) => {
        const truck = driver.assignedTruck;
        const route = truck?.assignedRoute;

        return {
          id: driver.id,
          userNumber: driver.userNumber,
          name: driver.name ?? driver.email,
          email: driver.email,
          addedAt: driver.createdAt.toISOString(),
          truck: truck
            ? {
                id: truck.id,
                truckNumber: truck.truckNumber,
                plateNumber: truck.plateNumber,
                status: truck.status,
                // A driver works from their truck's branch.
                branchId: truck.branchId,
                route: route
                  ? {
                      routeDisplayNumber: generateRouteNumber(route.routeNumber),
                      name: route.name,
                    }
                  : null,
              }
            : null,
        };
      }),
    };
  });

  // Removes a driver account. Their truck stays and becomes driverless.
  // Refused while the driver is on a route in progress, or when other
  // records (incident reports, sent notifications) still point to them.
  app.delete(
    "/drivers/:id",
    { schema: { params: truckParamsSchema } },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const driver = await prisma.user.findFirst({
        where: { id, role: "DRIVER" },
        select: {
          id: true,
          name: true,
          email: true,
          assignedTruck: {
            select: {
              id: true,
              assignedRoute: { select: { name: true, status: true } },
            },
          },
          _count: {
            select: {
              incidentReports: true,
              createdNotifications: true,
            },
          },
        },
      });

      if (!driver) {
        return reply.code(404).send({
          success: false,
          error: "Driver not found.",
        });
      }

      const route = driver.assignedTruck?.assignedRoute;

      if (route?.status === "In Progress") {
        return reply.code(409).send({
          success: false,
          error: `${driver.name ?? driver.email} is on ${route.name}, which is in progress. Remove them after the route is finished.`,
        });
      }

      if (driver._count.incidentReports > 0 || driver._count.createdNotifications > 0) {
        return reply.code(409).send({
          success: false,
          error: `${driver.name ?? driver.email} has incident reports or notifications on record, so the account cannot be removed.`,
        });
      }

      await prisma.$transaction([
        prisma.truck.updateMany({
          where: { assignedDriverId: driver.id },
          data: { assignedDriverId: null },
        }),
        prisma.driverLocation.deleteMany({ where: { driverId: driver.id } }),
        prisma.user.delete({ where: { id: driver.id } }),
      ]);

      return {
        success: true,
        data: { id: driver.id },
      };
    },
  );

  app.get("/assignment-options", async () => {
    const [routes, ecoAides, drivers] = await Promise.all([
      prisma.route.findMany({
        orderBy: { routeNumber: "asc" },
        select: {
          id: true,
          routeNumber: true,
          name: true,
          wasteType: true,
          routeType: true,
          startBranchId: true,
          stopLocations: true,
        },
      }),
      prisma.user.findMany({
        where: { role: "ECO_AIDE" },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
        },
      }),
      prisma.user.findMany({
        where: { role: "DRIVER" },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        routes: routes.map((route) => ({
          id: route.id,
          label: `RT-${String(route.routeNumber).padStart(3, "0")} - ${route.name}`,
          wasteType: route.wasteType,
          routeType: route.routeType,
          // Older routes with no saved branch use the branch nearest their stops.
          startBranchId: routeBranchId(route),
        })),
        ecoAides: ecoAides.map((ecoAide) => ({
          id: ecoAide.id,
          label: ecoAide.name ?? ecoAide.email,
        })),
        drivers: drivers.map((driver) => ({
          id: driver.id,
          label: driver.name ?? driver.email,
        })),
      },
    };
  });

  app.post(
    "/",
    { schema: { body: truckBodySchema } },
    async (request, reply) => {
    const body = request.body as TruckInput;

    try {
      const truck = await prisma.$transaction(async (tx) => {
        const sequence = await getNextSequence(tx, "truck");

        return tx.truck.create({
          data: {
            truckNumber: generateTruckNumber(sequence),
            plateNumber: body.plateNumber.trim().toUpperCase(),
            model: body.model.trim(),
            capacity: body.capacity.trim(),
            status: body.status,
            assignedDriverId: body.assignedDriverId || null,
            branchId: body.branchId,
            wasteType: body.wasteType,
          },
          include: truckInclude,
        });
      });

      return reply.code(201).send({
        success: true,
        data: formatTruck(truck),
      });
    } catch (error: unknown) {
      if (getPrismaErrorCode(error) === "P2002") {
        return reply.code(409).send({
          success: false,
          error: "The plate number or assigned driver is already in use.",
        });
      }

      throw error;
    }
  });

  app.patch(
    "/:id",
    { schema: { params: truckParamsSchema, body: truckBodySchema } },
    async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as TruckInput;

    try {
      const truck = await prisma.$transaction(async (tx) => {
        // A truck on a route must keep carrying that route's waste type.
        const current = await tx.truck.findUnique({
          where: { id },
          select: {
            assignedRoute: { select: { id: true, name: true, wasteType: true } },
          },
        });
        const route = current?.assignedRoute;

        if (route && body.wasteType !== route.wasteType) {
          throw new FleetConflictError(
            `This truck is on ${route.name}, which collects ${wasteTypeLabel(route.wasteType)} waste. Keep that waste type, or assign another truck to the route first.`,
          );
        }

        const updated = await tx.truck.update({
          where: { id },
          data: {
            plateNumber: body.plateNumber.trim().toUpperCase(),
            model: body.model.trim(),
            capacity: body.capacity.trim(),
            status: body.status,
            assignedDriverId: body.assignedDriverId || null,
            branchId: body.branchId,
            wasteType: body.wasteType,
          },
          include: truckInclude,
        });

        // The route path starts from the truck's branch.
        if (route) {
          await tx.route.update({
            where: { id: route.id },
            data: { startBranchId: body.branchId },
          });
        }

        return updated;
      }, SERIALIZABLE);

      return {
        success: true,
        data: formatTruck(truck),
      };
    } catch (error: unknown) {
      if (error instanceof FleetConflictError) {
        return reply.code(409).send({ success: false, error: error.message });
      }

      if (getPrismaErrorCode(error) === "P2034") {
        return reply.code(409).send({ success: false, error: CONCURRENT_CHANGE_MESSAGE });
      }

      if (getPrismaErrorCode(error) === "P2025") {
        return reply.code(404).send({
          success: false,
          error: "Truck not found.",
        });
      }

      if (getPrismaErrorCode(error) === "P2002") {
        return reply.code(409).send({
          success: false,
          error: "The plate number or assigned driver is already in use.",
        });
      }

      throw error;
    }
  });

  // Removes a truck from the fleet. A truck still assigned to a route is
  // refused so the route is never left pointing at nothing without the admin
  // knowing. Location history rows keep their data and lose the truck link
  // (the foreign key is ON DELETE SET NULL).
  app.delete(
    "/:id",
    { schema: { params: truckParamsSchema } },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const truck = await prisma.truck.findUnique({
        where: { id },
        select: {
          id: true,
          assignedRoute: { select: { name: true } },
        },
      });

      if (!truck) {
        return reply.code(404).send({
          success: false,
          error: "Truck not found.",
        });
      }

      if (truck.assignedRoute) {
        return reply.code(409).send({
          success: false,
          error: `This truck is assigned to ${truck.assignedRoute.name}. Assign another truck to that route before removing this one.`,
        });
      }

      await prisma.truck.delete({ where: { id } });

      return {
        success: true,
        data: { databaseId: id },
      };
    },
  );

  app.patch(
    "/:id/assignment",
    {
      schema: {
        params: truckParamsSchema,
        body: truckAssignmentBodySchema,
      },
    },
    async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      routeId: string;
      ecoAideId?: string | null;
    };

    try {
      await prisma.$transaction(async (tx) => {
        const [assigningTruck, targetRoute] = await Promise.all([
          tx.truck.findUnique({
            where: { id },
            select: { branchId: true, wasteType: true },
          }),
          tx.route.findUnique({
            where: { id: body.routeId },
            select: { wasteType: true, routeType: true, startBranchId: true, stopLocations: true },
          }),
        ]);

        if (assigningTruck && targetRoute && !truckCarries(assigningTruck, targetRoute.wasteType)) {
          throw new FleetConflictError(wasteTypeMismatchMessage(targetRoute.wasteType));
        }

        const branchReason =
          assigningTruck && targetRoute ? branchMismatchReason(assigningTruck, targetRoute) : null;

        if (branchReason) {
          throw new FleetConflictError(branchReason);
        }

        await tx.route.updateMany({
          where: { assignedTruckId: id },
          data: { assignedTruckId: null },
        });
        await tx.route.update({
          where: { id: body.routeId },
          data: {
            assignedTruckId: id,
            ...(body.ecoAideId && { assignedEcoAideId: body.ecoAideId }),
            ...(assigningTruck?.branchId && { startBranchId: assigningTruck.branchId }),
          },
        });
      }, SERIALIZABLE);

      const truck = await prisma.truck.findUnique({
        where: { id },
        include: truckInclude,
      });

      if (!truck) {
        return reply.code(404).send({
          success: false,
          error: "Truck not found.",
        });
      }

      return {
        success: true,
        data: formatTruck(truck),
      };
    } catch (error: unknown) {
      if (getPrismaErrorCode(error) === "P2025") {
        return reply.code(404).send({
          success: false,
          error: "The selected truck, route, or Eco-Aide was not found.",
        });
      }

      if (error instanceof FleetConflictError) {
        return reply.code(409).send({ success: false, error: error.message });
      }

      if (getPrismaErrorCode(error) === "P2034") {
        return reply.code(409).send({ success: false, error: CONCURRENT_CHANGE_MESSAGE });
      }

      if (getPrismaErrorCode(error) === "P2002") {
        return reply.code(409).send({
          success: false,
          error: "The selected route or Eco-Aide is already assigned.",
        });
      }

      throw error;
    }
  });
  done();
};

