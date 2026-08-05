/* eslint-disable */
import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@bazoora/db";
import { emitTruckLocation } from "../plugins/socket.js";
import { authGuard, requireRole } from "../lib/auth.js";

// In-memory store for planned routes
const plannedRoutes = new Map<string, any[]>();

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
      include: {
        assignedDriver: {
          include: {
            driverLocation: true,
          },
        },
      },
    });

    const formatted = trucks.map((t: any) => {
      const location = t.assignedDriver?.driverLocation;
      return {
        id: t.id,
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
    });
      return { success: true, data: formatted };
    },
  );

  // GET /trucks/me
  app.get(
    "/me",
    {
      preHandler: [
        authGuard,
        requireRole("DRIVER"),
      ],
    },
    async (req, reply) => {
      const driverId = req.user.sub;

      const truck = await prisma.truck.findFirst({
        where: {
          assignedDriverId: driverId,
        },
        include: {
          assignedDriver: {
            include: {
              driverLocation: true,
            },
          },
        },
      });

      if (!truck) {
        return reply.code(404).send({
          success: false,
          error: "No truck is assigned to this driver.",
        });
      }

      const location = truck.assignedDriver?.driverLocation;

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
      preHandler: [
        authGuard,
        requireRole("DRIVER"),
      ],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const driverId = req.user.sub;

      const body = req.body as {
        lat: number;
        lng: number;
        heading?: number;
        speed?: number;
        timestamp: string;
      };

      const assignedTruck = await prisma.truck.findFirst({
        where: {
          id,
          assignedDriverId: driverId,
        },
        select: {
          id: true,
        },
      });

      if (!assignedTruck) {
        return reply.code(403).send({
          success: false,
          error: "You may only update the location of your assigned truck.",
        });
      }

      const location = await prisma.driverLocation.upsert({
        where: { driverId },
        update: {
          truckId: id,
          latitude: body.lat,
          longitude: body.lng,
        },
        create: {
          driverId,
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
        timestamp: body.timestamp,
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
