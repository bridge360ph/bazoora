/* eslint-disable */
import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@bazoora/db";
import { emitTruckLocation } from "../plugins/socket.js";
import { authGuard, requireRole } from "../lib/auth.js";

// In-memory store for planned routes
const plannedRoutes = new Map<string, any[]>();

const latestLocationInclude = {
  driverLocations: {
    orderBy: {
      updatedAt: "desc" as const,
    },
    take: 1,
  },
};

function formatTruck(t: any) {
  const location = t.driverLocations[0];

  return {
    id: t.id,
    truckNumber: t.truckNumber,
    plateNumber: t.plateNumber,
    status: t.status === "Active" ? "active" : "idle",
    currentLocation: location
      ? {
          lat: location.latitude,
          lng: location.longitude,
          timestamp: location.updatedAt.toISOString(),
        }
      : null,
    plannedRoute: plannedRoutes.get(t.id) || [],
    organizationId: "org-1",
  };
}

const locationBodySchema = {
  body: {
    type: "object",
    required: ["lat", "lng"],
    properties: {
      lat: { type: "number", minimum: -90, maximum: 90 },
      lng: { type: "number", minimum: -180, maximum: 180 },
      heading: { type: "number" },
      speed: { type: "number" },
      timestamp: { type: "string", maxLength: 64 },
    },
  },
} as const;

export const trucksRoutes: FastifyPluginAsync = async (app) => {
  // GET /trucks
  app.get(
    "/",
    {
      preHandler: [
        authGuard,
        requireRole(
          "SUPER_ADMIN",
          "GOVERNMENT_ADMIN",
          "HAULING_ADMIN",
          "DRIVER",
        ),
      ],
    },
    async (_req, _reply) => {
      const trucks = await prisma.truck.findMany({
        include: latestLocationInclude,
      });

      return { success: true, data: trucks.map(formatTruck) };
    },
  );

  // GET /trucks/live
  // Read-only view for residents and businesses tracking collection. Only
  // trucks that are out on a route and reporting a location are returned, so
  // idle trucks are not exposed to every resident account.
  app.get(
    "/live",
    {
      preHandler: [
        authGuard,
        requireRole("RESIDENT", "BUSINESS"),
      ],
    },
    async (_req, _reply) => {
      const trucks = await prisma.truck.findMany({
        where: {
          status: "Active",
          driverLocations: {
            some: {},
          },
        },
        include: latestLocationInclude,
      });

      return { success: true, data: trucks.map(formatTruck) };
    },
  );

  // GET /trucks/me
  // Drivers get the truck assigned to them. Eco-aides get the truck on the
  // route assigned to them, which is the truck id they post locations for.
  app.get(
    "/me",
    {
      preHandler: [
        authGuard,
        requireRole("DRIVER", "ECO_AIDE"),
      ],
    },
    async (req, reply) => {
      const userId = req.user.sub;

      const truck = await prisma.truck.findFirst({
        where:
          req.user.role === "ECO_AIDE"
            ? { assignedRoute: { assignedEcoAideId: userId } }
            : { assignedDriverId: userId },
        include: latestLocationInclude,
      });

      if (!truck) {
        return reply.code(404).send({
          success: false,
          error: "No truck is assigned to you.",
        });
      }

      const location = truck.driverLocations[0];

      return reply.send({
        success: true,
        data: {
          id: truck.id,
          plateNumber: truck.plateNumber,
          status: truck.status === "Active" ? "active" : "idle",
          currentLocation: location
            ? {
                lat: location.latitude,
                lng: location.longitude,
                timestamp: location.updatedAt.toISOString(),
              }
            : null,
          plannedRoute: plannedRoutes.get(truck.id) || [],
          organizationId: "org-1",
        },
      });
    },
  );

  // POST /trucks/:id/location
  app.post(
    "/:id/location",
    {
      schema: locationBodySchema,
      preHandler: [
        authGuard,
        requireRole("DRIVER", "ECO_AIDE"),
      ],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const userId = req.user.sub;

      const body = req.body as {
        lat: number;
        lng: number;
        heading?: number;
        speed?: number;
        timestamp?: string;
      };

      const truck = await prisma.truck.findUnique({
        where: { id },
        select: {
          id: true,
          assignedDriverId: true,
          assignedRoute: {
            select: {
              assignedEcoAide: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!truck) {
        return reply.code(404).send({
          success: false,
          error: "Truck was not found.",
        });
      }

      const isDriver =
        req.user.role === "DRIVER" &&
        truck.assignedDriverId === userId;

      const isEcoAide =
        req.user.role === "ECO_AIDE" &&
        truck.assignedRoute?.assignedEcoAide?.id === userId;

      if (!isDriver && !isEcoAide) {
        return reply.code(403).send({
          success: false,
          error:
            "You may only update the location of your assigned truck.",
        });
      }

      // DriverLocation is one row per user (driverId is unique), so key the
      // write on the user. Looking it up by truck instead failed with a unique
      // violation once a driver moved to another truck, and let an eco-aide's
      // coordinates overwrite the driver's row.
      const location = await prisma.driverLocation.upsert({
        where: {
          driverId: userId,
        },
        update: {
          truckId: id,
          latitude: body.lat,
          longitude: body.lng,
        },
        create: {
          driverId: userId,
          truckId: id,
          latitude: body.lat,
          longitude: body.lng,
        },
      });

      await prisma.truck.update({
        where: { id },
        data: {
          status: "Active",
        },
      });

      emitTruckLocation("org-1", {
        truckId: id,
        lat: body.lat,
        lng: body.lng,
        timestamp: body.timestamp ?? new Date().toISOString(),
      });

      return reply.send({
        success: true,
        data: location,
      });
    },
  );

  // PATCH /trucks/:id
  app.patch(
    "/:id",
    {
      preHandler: [
        authGuard,
        requireRole(
          "SUPER_ADMIN",
          "GOVERNMENT_ADMIN",
          "HAULING_ADMIN",
        ),
      ],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      const body = req.body as {
        plannedRoute?: any[];
        status?: string;
      };

      const existingTruck = await prisma.truck.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existingTruck) {
        return reply.code(404).send({
          success: false,
          error: "Truck was not found.",
        });
      }

      const updated = await prisma.truck.update({
        where: { id },
        data: {
          status: body.status === "active" ? "Active" : "Idle",
        },
      });

      if (body.plannedRoute) {
        plannedRoutes.set(id, body.plannedRoute);
      }

      return reply.send({
        success: true,
        data: updated,
      });
    },
  );

  // POST /trucks/:id/finish-route
  app.post(
    "/:id/finish-route",
    {
      preHandler: authGuard,
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      const truck = await prisma.truck.findUnique({
        where: { id },
        select: {
          id: true,
          assignedDriverId: true,
        },
      });

      if (!truck) {
        return reply.code(404).send({
          success: false,
          error: "Truck was not found.",
        });
      }

      const adminRoles = [
        "SUPER_ADMIN",
        "GOVERNMENT_ADMIN",
        "HAULING_ADMIN",
      ];

      const isAdmin = adminRoles.includes(req.user.role);
      const isAssignedDriver =
        req.user.role === "DRIVER" &&
        truck.assignedDriverId === req.user.sub;

      if (!isAdmin && !isAssignedDriver) {
        return reply.code(403).send({
          success: false,
          error:
            "You may only finish a route for your assigned truck.",
        });
      }

      const updated = await prisma.truck.update({
        where: { id },
        data: {
          status: "Idle",
        },
      });

      plannedRoutes.delete(id);

      return reply.send({
        success: true,
        data: updated,
      });
    },
  );
};