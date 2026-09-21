/* eslint-disable */

import type { FastifyPluginAsync } from "fastify";

import { prisma } from "@bazoora/db";

async function geocodeAddress(address: string) {
  const token = process.env.MAPBOX_ACCESS_TOKEN;

  if (!token) {
    throw new Error("MAPBOX_ACCESS_TOKEN is not configured");
  }

  const url =
    `https://api.mapbox.com/search/geocode/v6/forward` +
    `?q=${encodeURIComponent(address)}` +
    `&access_token=${token}` +
    `&limit=1`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Mapbox geocoding request failed");
  }

  const data = (await response.json()) as {
    features?: Array<{
      geometry?: {
        coordinates?: [number, number];
      };
    }>;
  };

  const coordinates = data.features?.[0]?.geometry?.coordinates;

  if (!coordinates) {
    return null;
  }

  return {
    longitude: coordinates[0],
    latitude: coordinates[1],
  };
}

export const routesRoutes: FastifyPluginAsync = async (app) => {
  // GET /routes
  app.get("/", async (_req, _reply) => {
    const routes = await prisma.route.findMany({
      orderBy: {
        routeNumber: "asc",
      },
      include: {
        assignedTruck: true,
        assignedEcoAide: true,
        routeStops: {
          orderBy: {
            stopNumber: "asc",
          },
        },
      },
    });

    return {
      success: true,
      data: routes,
    };
  });

  // GET /routes/:id
  app.get("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };

    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        assignedTruck: true,
        assignedEcoAide: true,
        routeStops: {
          orderBy: {
            stopNumber: "asc",
          },
        },
      },
    });

    if (!route) {
      return reply.code(404).send({
        success: false,
        error: "Route not found",
      });
    }

    return {
      success: true,
      data: route,
    };
  });

  // POST /routes
  app.post("/", async (req, reply) => {
    const body = req.body as {
      name: string;
      barangay: string;
      waypoints?: unknown;
      wasteType: string;
      collectionDay: string;
      startTime: string;
      status?: string;
      stops?: number;
      routeType: string;
      assignedEcoAideId?: string | null;
      assignedTruckId?: string | null;
    };

    if (
      !body.name ||
      !body.barangay ||
      !body.wasteType ||
      !body.collectionDay ||
      !body.startTime ||
      !body.routeType
    ) {
      return reply.code(400).send({
        success: false,
        error: "Missing required route fields",
      });
    }

    const lastRoute = await prisma.route.findFirst({
      orderBy: {
        routeNumber: "desc",
      },
      select: {
        routeNumber: true,
      },
    });

    const routeNumber = (lastRoute?.routeNumber ?? 0) + 1;

    const waypoints =
      typeof body.waypoints === "string"
        ? body.waypoints
        : JSON.stringify(body.waypoints ?? []);

    const route = await prisma.route.create({
      data: {
        routeNumber,
        name: body.name,
        barangay: body.barangay,
        waypoints,
        wasteType: body.wasteType,
        collectionDay: body.collectionDay,
        startTime: body.startTime,
        status: body.status ?? "Not Started",
        stops: body.stops ?? 0,
        routeType: body.routeType,
        assignedEcoAideId: body.assignedEcoAideId ?? null,
        assignedTruckId: body.assignedTruckId ?? null,
      },
      include: {
        assignedTruck: true,
        assignedEcoAide: true,
        routeStops: {
          orderBy: {
            stopNumber: "asc",
          },
        },
      },
    });

    return reply.code(201).send({
      success: true,
      data: route,
    });
  });

  // PATCH /routes/:id
  app.patch("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };

    const body = req.body as {
      name?: string;
      barangay?: string;
      waypoints?: unknown;
      wasteType?: string;
      collectionDay?: string;
      startTime?: string;
      status?: string;
      stops?: number;
      routeType?: string;
      assignedEcoAideId?: string | null;
      assignedTruckId?: string | null;
    };

    const existingRoute = await prisma.route.findUnique({
      where: { id },
    });

    if (!existingRoute) {
      return reply.code(404).send({
        success: false,
        error: "Route not found",
      });
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    if (body.barangay !== undefined) {
      updateData.barangay = body.barangay;
    }

    if (body.waypoints !== undefined) {
      updateData.waypoints =
        typeof body.waypoints === "string"
          ? body.waypoints
          : JSON.stringify(body.waypoints);
    }

    if (body.wasteType !== undefined) {
      updateData.wasteType = body.wasteType;
    }

    if (body.collectionDay !== undefined) {
      updateData.collectionDay = body.collectionDay;
    }

    if (body.startTime !== undefined) {
      updateData.startTime = body.startTime;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.stops !== undefined) {
      updateData.stops = body.stops;
    }

    if (body.routeType !== undefined) {
      updateData.routeType = body.routeType;
    }

    if (body.assignedEcoAideId !== undefined) {
      updateData.assignedEcoAideId = body.assignedEcoAideId;
    }

    if (body.assignedTruckId !== undefined) {
      updateData.assignedTruckId = body.assignedTruckId;
    }

    const route = await prisma.route.update({
      where: { id },
      data: updateData,
      include: {
        assignedTruck: true,
        assignedEcoAide: true,
        routeStops: {
          orderBy: {
            stopNumber: "asc",
          },
        },
      },
    });

    return {
      success: true,
      data: route,
    };
  });

  // DELETE /routes/:id
  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };

    const existingRoute = await prisma.route.findUnique({
      where: { id },
    });

    if (!existingRoute) {
      return reply.code(404).send({
        success: false,
        error: "Route not found",
      });
    }

    await prisma.route.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Route deleted successfully",
    };
  });

  // GET /routes/:routeId/stops
  app.get("/:routeId/stops", async (req, reply) => {
    const { routeId } = req.params as { routeId: string };

    const route = await prisma.route.findUnique({
      where: { id: routeId },
      select: { id: true },
    });

    if (!route) {
      return reply.code(404).send({
        success: false,
        error: "Route not found",
      });
    }

    const stops = await prisma.routeStop.findMany({
      where: { routeId },
      orderBy: {
        stopNumber: "asc",
      },
    });

    return {
      success: true,
      data: stops,
    };
  });

  // POST /routes/:routeId/stops
  // Adds a collection point and automatically geocodes its address.
  app.post("/:routeId/stops", async (req, reply) => {
    const { routeId } = req.params as { routeId: string };

    const body = req.body as {
      address: string;
    };

    if (!body.address?.trim()) {
      return reply.code(400).send({
        success: false,
        error: "Collection point address is required",
      });
    }

    const route = await prisma.route.findUnique({
      where: { id: routeId },
      select: { id: true },
    });

    if (!route) {
      return reply.code(404).send({
        success: false,
        error: "Route not found",
      });
    }

    const address = body.address.trim();

    let coordinates;

    try {
      coordinates = await geocodeAddress(address);
    } catch (error) {
      req.log.error(error);

      return reply.code(502).send({
        success: false,
        error: "Unable to geocode collection point address",
      });
    }

    if (!coordinates) {
      return reply.code(400).send({
        success: false,
        error: "Address could not be located. Please enter a more specific address.",
      });
    }

    const lastStop = await prisma.routeStop.findFirst({
      where: { routeId },
      orderBy: {
        stopNumber: "desc",
      },
      select: {
        stopNumber: true,
      },
    });

    const stopNumber = (lastStop?.stopNumber ?? 0) + 1;

    const stop = await prisma.routeStop.create({
      data: {
        routeId,
        stopNumber,
        address,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      },
    });

    const stopCount = await prisma.routeStop.count({
      where: { routeId },
    });

    await prisma.route.update({
      where: { id: routeId },
      data: {
        stops: stopCount,
      },
    });

    return reply.code(201).send({
      success: true,
      data: stop,
    });
  });

  // PATCH /routes/:routeId/stops/:stopId
  // Updates a collection point and re-geocodes if the address changes.
  app.patch("/:routeId/stops/:stopId", async (req, reply) => {
    const { routeId, stopId } = req.params as {
      routeId: string;
      stopId: string;
    };

    const body = req.body as {
      address?: string;
    };

    const existingStop = await prisma.routeStop.findFirst({
      where: {
        id: stopId,
        routeId,
      },
    });

    if (!existingStop) {
      return reply.code(404).send({
        success: false,
        error: "Collection point not found",
      });
    }

    const updateData: {
      address?: string;
      latitude?: number | null;
      longitude?: number | null;
    } = {};

    if (body.address !== undefined) {
      const address = body.address.trim();

      if (!address) {
        return reply.code(400).send({
          success: false,
          error: "Collection point address cannot be empty",
        });
      }

      let coordinates;

      try {
        coordinates = await geocodeAddress(address);
      } catch (error) {
        req.log.error(error);

        return reply.code(502).send({
          success: false,
          error: "Unable to geocode collection point address",
        });
      }

      if (!coordinates) {
        return reply.code(400).send({
          success: false,
          error:
            "Address could not be located. Please enter a more specific address.",
        });
      }

      updateData.address = address;
      updateData.latitude = coordinates.latitude;
      updateData.longitude = coordinates.longitude;
    }

    const stop = await prisma.routeStop.update({
      where: { id: stopId },
      data: updateData,
    });

    return {
      success: true,
      data: stop,
    };
  });

  // DELETE /routes/:routeId/stops/:stopId
  app.delete("/:routeId/stops/:stopId", async (req, reply) => {
    const { routeId, stopId } = req.params as {
      routeId: string;
      stopId: string;
    };

    const existingStop = await prisma.routeStop.findFirst({
      where: {
        id: stopId,
        routeId,
      },
    });

    if (!existingStop) {
      return reply.code(404).send({
        success: false,
        error: "Collection point not found",
      });
    }

    await prisma.routeStop.delete({
      where: { id: stopId },
    });

    const remainingStops = await prisma.routeStop.findMany({
      where: { routeId },
      orderBy: {
        stopNumber: "asc",
      },
    });

    await prisma.$transaction(
      remainingStops.map((stop, index) =>
        prisma.routeStop.update({
          where: { id: stop.id },
          data: {
            stopNumber: index + 1,
          },
        }),
      ),
    );

    await prisma.route.update({
      where: { id: routeId },
      data: {
        stops: remainingStops.length,
      },
    });

    return {
      success: true,
      message: "Collection point deleted successfully",
    };
  });
};

