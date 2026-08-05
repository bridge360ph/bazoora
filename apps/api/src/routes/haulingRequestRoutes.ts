import type { FastifyPluginCallback } from "fastify";

import {
  authGuard,
  requireRole,
} from "../lib/auth.js";
import {
  createHaulingRequestSchema,
  haulingRequestParamsSchema,
} from "../schemas/haulingRequest.schema.js";
import {
  approveHaulingRequest,
  createHaulingRequest,
  denyHaulingRequest,
  getHaulingRequests,
} from "../services/haulingRequestService.js";

const adminRoles = [
  "SUPER_ADMIN",
  "GOVERNMENT_ADMIN",
  "HAULING_ADMIN",
] as const;

export const haulingRequestRoutes: FastifyPluginCallback = (
  app,
  _opts,
  done,
) => {
  app.get(
    "/",
    {
      preHandler: [
        authGuard,
        requireRole(...adminRoles),
      ],
    },
    () => {
      return getHaulingRequests();
    },
  );

  app.post(
    "/",
    {
      schema: createHaulingRequestSchema,
      preHandler: [
        authGuard,
        requireRole("RESIDENT", "BUSINESS"),
      ],
    },
    (request) => {
      return createHaulingRequest(
        request.body as never,
      );
    },
  );

  app.patch(
    "/:id/approve",
    {
      schema: haulingRequestParamsSchema,
      preHandler: [
        authGuard,
        requireRole(...adminRoles),
      ],
    },
    (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      const result = approveHaulingRequest(id);

      if (!result) {
        return reply.status(404).send({
          message: "Hauling request not found",
        });
      }

      return result;
    },
  );

  app.patch(
    "/:id/deny",
    {
      schema: haulingRequestParamsSchema,
      preHandler: [
        authGuard,
        requireRole(...adminRoles),
      ],
    },
    (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      const result = denyHaulingRequest(id);

      if (!result) {
        return reply.status(404).send({
          message: "Hauling request not found",
        });
      }

      return result;
    },
  );

  done();
};
