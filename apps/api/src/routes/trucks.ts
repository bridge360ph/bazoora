/* eslint-disable */
import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@bazoora/db";
import { emitTruckLocation } from "../plugins/socket.js";
import { verifyAccessToken } from "../lib/jwt.js";

// In-memory store for planned routes
const plannedRoutes = new Map<string, any[]>();

export const trucksRoutes: FastifyPluginAsync = async (app) => {
  // Helper to extract driver/user info from auth token
  // Returns null when the request can't be authenticated. Callers must reject
  // with 401 on null. The mock fallback is DEV/DEMO ONLY (Role Simulator) and
  // fails closed in production — no more defaulting to a mock identity. See #52.
  const getDriverIdFromAuth = (
    authorizationHeader?: string,
  ): { driverId: string; orgId: string } | null => {
    if (authorizationHeader && authorizationHeader.startsWith("Bearer ")) {
      const token = authorizationHeader.substring(7);
      try {
        const payload = verifyAccessToken(token);
        return {
          driverId: payload.sub,
          orgId: payload.organizationId ?? "org-1",
        };
      } catch {
        // fall through to dev fallback / rejection
      }
    }

    if (process.env.NODE_ENV !== "production") {
      return { driverId: "usr-mock-1", orgId: "org-1" };
    }

    return null;
  };

  // GET /trucks
  app.get("/", async (_req, _reply) => {
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
  });

  // GET /trucks/me
  app.get("/me", async (req, reply) => {
    const auth = getDriverIdFromAuth(req.headers.authorization);
    if (!auth) {
      return reply.code(401).send({ success: false, error: "unauthorized" });
    }
    const { driverId } = auth;

    // Ensure the driver user exists in the DB to prevent foreign key errors
    await prisma.user.upsert({
      where: { id: driverId },
      update: {},
      create: {
        id: driverId,
        email: `${driverId}@bazoora.com`,
        password: "", // TODO: seed drivers through the proper auth flow
        role: "DRIVER",
      },
    });

    let truck = await prisma.truck.findFirst({
      where: { assignedDriverId: driverId },
      include: {
        assignedDriver: {
          include: {
            driverLocation: true,
          },
        },
      },
    });

    // If no truck assigned to this driver, assign one or create one
    if (!truck) {
      truck = await prisma.truck.findFirst({
        where: { assignedDriverId: null },
        include: {
          assignedDriver: {
            include: {
              driverLocation: true,
            },
          },
        },
      });

      if (!truck) {
        truck = await prisma.truck.findFirst({
          include: {
            assignedDriver: {
              include: {
                driverLocation: true,
              },
            },
          },
        });
      }

      if (!truck) {
        // Create new truck
        truck = await prisma.truck.create({
          data: {
            plateNumber: "LGU-TRK-777",
            model: "Fuso Canter",
            capacity: "5 Tons",
            status: "Idle",
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
      } else {
        // Assign this truck to the driver
        truck = await prisma.truck.update({
          where: { id: truck.id },
          data: { assignedDriverId: driverId },
          include: {
            assignedDriver: {
              include: {
                driverLocation: true,
              },
            },
          },
        });
      }
    }

    const location = truck.assignedDriver?.driverLocation;

    // Map to expected client shape
    const formatted = {
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
    };

    return { success: true, data: formatted };
  });

  // POST /trucks/:id/location
  app.post("/:id/location", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as {
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
      timestamp: string;
    };

    const auth = getDriverIdFromAuth(req.headers.authorization);
    if (!auth) {
      return reply.code(401).send({ success: false, error: "unauthorized" });
    }
    const { driverId, orgId } = auth;

    // Ensure the driver user exists in the DB to prevent foreign key errors
    await prisma.user.upsert({
      where: { id: driverId },
      update: {},
      create: {
        id: driverId,
        email: `${driverId}@bazoora.com`,
        password: "", // TODO: seed drivers through the proper auth flow
        role: "DRIVER",
      },
    });

    // Upsert coordinates in DriverLocation table
    const location = await prisma.driverLocation.upsert({
      where: { driverId },
      update: {
        latitude: body.lat,
        longitude: body.lng,
      },
      create: {
        driverId,
        latitude: body.lat,
        longitude: body.lng,
      },
    });

    // Update truck status to Active and ensure driver assignment is linked
    await prisma.truck.update({
      where: { id },
      data: {
        status: "Active",
        assignedDriverId: driverId,
      },
    });

    // Broadcast live coordinates to Room
    emitTruckLocation(orgId, {
      truckId: id,
      lat: body.lat,
      lng: body.lng,
      timestamp: body.timestamp,
    });

    return { success: true, data: location };
  });

  // PATCH /trucks/:id
  app.patch("/:id", async (req, _reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as {
      plannedRoute?: any[];
      status?: string;
    };

    const updated = await prisma.truck.update({
      where: { id },
      data: {
        status: body.status === "active" ? "Active" : "Idle",
      },
    });

    if (body.plannedRoute) {
      plannedRoutes.set(id, body.plannedRoute);
    }

    return { success: true, data: updated };
  });

  // POST /trucks/:id/finish-route
  app.post("/:id/finish-route", async (req, _reply) => {
    const { id } = req.params as { id: string };

    const updated = await prisma.truck.update({
      where: { id },
      data: {
        status: "Idle",
      },
    });

    plannedRoutes.delete(id);

    return { success: true, data: updated };
  });
};
