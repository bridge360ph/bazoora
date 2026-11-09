import type { FastifyPluginCallback } from "fastify";
import { authGuard, requireRole } from "../lib/auth.js";
import { findNearestRoads } from "../lib/roadLookup.js";

/** Points per request. The web app sends a barangay's grid in chunks. */
const MAX_POINTS = 40;

const nearestBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["points"],
  properties: {
    points: {
      type: "array",
      minItems: 1,
      maxItems: MAX_POINTS,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["lat", "lng"],
        properties: {
          lat: { type: "number", minimum: -90, maximum: 90 },
          lng: { type: "number", minimum: -180, maximum: 180 },
        },
      },
    },
  },
} as const;

export const routingRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.addHook("preHandler", authGuard);
  app.addHook("preHandler", requireRole("SUPER_ADMIN", "GOVERNMENT_ADMIN", "HAULING_ADMIN"));

  // POST /routing/nearest: the nearest road for each point, rate limited and
  // cached on the server. Each result is a road, null (no road near the
  // point) or "failed" (the routing server did not answer).
  app.post("/nearest", { schema: { body: nearestBodySchema } }, async (request) => {
    const { points } = request.body as { points: { lat: number; lng: number }[] };
    const results = await findNearestRoads(points);

    return { success: true, data: results };
  });

  done();
};
