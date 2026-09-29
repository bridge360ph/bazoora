import type { FastifyPluginAsync } from "fastify";
import crypto from "node:crypto";
import { prisma } from "@bazoora/db";
import { emitTruckLocation } from "../plugins/socket.js";
import { verifyAccessToken } from "../lib/jwt.js";

type AuthenticatedRequest = {
  headers: {
    authorization?: string;
  };
};

type LocationBody = {
  latitude: number;
  longitude: number;
};

type TruckStatusBody = {
  status?: string;
};

function getAuth(request: AuthenticatedRequest) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing access token");
  }

  const token = authorization.substring("Bearer ".length);

  return verifyAccessToken(token);
}

function normalizeTruckStatus(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "active") {
    return "Active";
  }

  if (normalized === "idle") {
    return "Idle";
  }

  if (normalized === "maintenance") {
    return "Maintenance";
  }

  return status;
}

export const trucksRoutes: FastifyPluginAsync = (app) => {
  app.get("/", async () => {
    const trucks = await prisma.truck.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: trucks,
    };
  });

  app.get("/me", async (request, reply) => {
    try {
      const auth = getAuth(
        request as unknown as AuthenticatedRequest,
      );

      const driverId = auth.sub;

      const truck = await prisma.truck.findFirst({
        where: {
          assignedDriverId: driverId,
        },
        include: {
          DriverLocation: true,
          Route: {
            include: {
              RouteStop: {
                orderBy: {
                  stopNumber: "asc",
                },
              },
            },
          },
        },
      });

      if (!truck) {
        return {
          success: true,
          data: null,
        };
      }

      const latestLocation =
        truck.DriverLocation.length > 0
          ? truck.DriverLocation[0]
          : null;

      return {
        success: true,
        data: {
          id: truck.id,
          plateNumber: truck.plateNumber,
          truckNumber: truck.truckNumber,
          model: truck.model,
          capacity: truck.capacity,
          status: truck.status.toLowerCase(),
          assignedDriverId: truck.assignedDriverId,

          currentLocation: latestLocation
            ? {
                lat: latestLocation.latitude,
                lng: latestLocation.longitude,
                timestamp:
                  latestLocation.updatedAt.toISOString(),
              }
            : null,

          plannedRoute: truck.Route
            ? truck.Route.RouteStop.map((stop) => ({
                id: stop.id,
                stopNumber: stop.stopNumber,
                address: stop.address,
                lat: stop.latitude,
                lng: stop.longitude,
              }))
            : [],
        },
      };
    } catch (error) {
      request.log.error(error);

      return reply.code(401).send({
        success: false,
        message: "Unauthorized",
      });
    }
  });

  app.post<{
    Params: {
      id: string;
    };
    Body: LocationBody;
  }>("/:id/location", async (request, reply) => {
    try {
      const auth = getAuth(
        request as unknown as AuthenticatedRequest,
      );

      const truckId = request.params.id;
      const { latitude, longitude } = request.body;

      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number"
      ) {
        return reply.code(400).send({
          success: false,
          message:
            "Latitude and longitude must be numbers",
        });
      }

      const truck = await prisma.truck.findUnique({
        where: {
          id: truckId,
        },
      });

      if (!truck) {
        return reply.code(404).send({
          success: false,
          message: "Truck not found",
        });
      }

      if (truck.assignedDriverId !== auth.sub) {
        return reply.code(403).send({
          success: false,
          message:
            "You are not assigned to this truck",
        });
      }

      const location =
        await prisma.driverLocation.upsert({
          where: {
            driverId: auth.sub,
          },
          update: {
            latitude,
            longitude,
            truckId,
          },
          create: {
            id: crypto.randomUUID(),
            driverId: auth.sub,
            latitude,
            longitude,
            truckId,
          },
        });

      const organizationId =
        auth.organizationId ?? "org-1";

      emitTruckLocation(
        organizationId,
        {
          truckId: truck.id,
          lat: location.latitude,
          lng: location.longitude,
          timestamp:
            location.updatedAt.toISOString(),
        },
      );

      return {
        success: true,
        data: {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp:
            location.updatedAt.toISOString(),
        },
      };
    } catch (error) {
      request.log.error(error);

      return reply.code(401).send({
        success: false,
        message: "Unauthorized",
      });
    }
  });

  app.patch<{
    Params: {
      id: string;
    };
    Body: TruckStatusBody;
  }>("/:id", async (request, reply) => {
    try {
      getAuth(
        request as unknown as AuthenticatedRequest,
      );

      const truck = await prisma.truck.findUnique({
        where: {
          id: request.params.id,
        },
      });

      if (!truck) {
        return reply.code(404).send({
          success: false,
          message: "Truck not found",
        });
      }

      const updatedTruck =
        await prisma.truck.update({
          where: {
            id: request.params.id,
          },
          data: {
            ...(request.body.status
              ? {
                  status: normalizeTruckStatus(
                    request.body.status,
                  ),
                }
              : {}),
          },
        });

      return {
        success: true,
        data: updatedTruck,
      };
    } catch (error) {
      request.log.error(error);

      return reply.code(401).send({
        success: false,
        message: "Unauthorized",
      });
    }
  });

  app.post<{
    Params: {
      id: string;
    };
  }>("/:id/finish-route", async (request, reply) => {
    try {
      const auth = getAuth(
        request as unknown as AuthenticatedRequest,
      );

      const truck = await prisma.truck.findUnique({
        where: {
          id: request.params.id,
        },
        include: {
          Route: true,
        },
      });

      if (!truck) {
        return reply.code(404).send({
          success: false,
          message: "Truck not found",
        });
      }

      if (truck.assignedDriverId !== auth.sub) {
        return reply.code(403).send({
          success: false,
          message:
            "You are not assigned to this truck",
        });
      }

      await prisma.truck.update({
        where: {
          id: truck.id,
        },
        data: {
          status: "Idle",
        },
      });

      if (truck.Route) {
        await prisma.route.update({
          where: {
            id: truck.Route.id,
          },
          data: {
            status: "Completed",
          },
        });
      }

      return {
        success: true,
        data: {
          truckId: truck.id,
          routeId: truck.Route?.id ?? null,
          status: "Completed",
        },
      };
    } catch (error) {
      request.log.error(error);

      return reply.code(401).send({
        success: false,
        message: "Unauthorized",
      });
    }
  });
};