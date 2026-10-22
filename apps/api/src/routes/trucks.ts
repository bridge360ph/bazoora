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
          driverLocations: {
            orderBy: {
              updatedAt: "desc",
            },
            take: 1,
          },
        },
      });

      const formatted = trucks.map((t: any) => {
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
          driverLocations: {
            orderBy: {
              updatedAt: "desc",
            },
            take: 1,
          },
        },
      });

      if (!truck) {
        return reply.code(404).send({
          success: false,
          error: "No truck is assigned to this driver.",
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
        timestamp: string;
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

      const existingLocation = await prisma.driverLocation.findFirst({
        where: {
          truckId: id,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      const location = existingLocation
        ? await prisma.driverLocation.update({
            where: {
              id: existingLocation.id,
            },
            data: {
              latitude: body.lat,
              longitude: body.lng,
            },
          })
        : await prisma.driverLocation.create({
            data: {
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