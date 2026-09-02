import type { FastifyPluginCallback } from "fastify";
import { prisma } from "@bazoora/db";
import { authGuard, requireRole } from "../lib/auth.js";
import type { Prisma } from "@bazoora/db";
import { getNextSequence } from "../lib/counter.js";
import { generateTruckNumber } from "../lib/displayId.js";

type TruckInput = {
  plateNumber: string;
  model: string;
  capacity: string;
  status: "Active" | "Idle" | "Under Maintenance";
  assignedDriverId?: string;
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
  required: ["plateNumber", "model", "capacity", "status"],
  properties: {
    plateNumber: { type: "string", minLength: 1, maxLength: 20 },
    model: { type: "string", minLength: 1, maxLength: 100 },
    capacity: { type: "string", minLength: 1, maxLength: 50 },
    status: {
      type: "string",
      enum: ["Active", "Idle", "Under Maintenance"],
    },
    assignedDriverId: { type: ["string", "null"] },
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
  required: ["routeId", "ecoAideId"],
  properties: {
    routeId: { type: "string", minLength: 1 },
    ecoAideId: { type: "string", minLength: 1 },
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

  app.get("/assignment-options", async () => {
    const [routes, ecoAides, drivers] = await Promise.all([
      prisma.route.findMany({
        orderBy: { routeNumber: "asc" },
        select: {
          id: true,
          routeNumber: true,
          name: true,
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
      const truck = await prisma.truck.update({
        where: { id },
        data: {
          plateNumber: body.plateNumber.trim().toUpperCase(),
          model: body.model.trim(),
          capacity: body.capacity.trim(),
          status: body.status,
          assignedDriverId: body.assignedDriverId || null,
        },
        include: truckInclude,
      });

      return {
        success: true,
        data: formatTruck(truck),
      };
    } catch (error: unknown) {
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
      ecoAideId: string;
    };

    try {
      await prisma.$transaction([
        prisma.route.updateMany({
          where: { assignedTruckId: id },
          data: { assignedTruckId: null },
        }),
        prisma.route.update({
          where: { id: body.routeId },
          data: {
            assignedTruckId: id,
            assignedEcoAideId: body.ecoAideId,
          },
        }),
      ]);

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

