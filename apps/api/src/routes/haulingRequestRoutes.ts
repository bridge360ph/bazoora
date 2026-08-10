import type { FastifyPluginCallback } from "fastify";
import type { CreateHaulingRequestInput } from "@bazoora/shared";

import {
  authGuard,
  requireRole,
} from "../lib/auth.js";
import {
  createHaulingRequestSchema,
  denyHaulingRequestSchema,
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
    async () => {
      return await getHaulingRequests();
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
    async (request) => {
      return await createHaulingRequest(
        request.body as CreateHaulingRequestInput,
        request.user.sub,
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
    async (request, reply) => {
      try {
        const { id } = request.params as {
          id: string;
        };

        const result = await approveHaulingRequest(
          id,
          request.user.sub,
        );

        if (!result) {
          return reply.status(404).send({
            message: "Hauling request not found",
          });
        }

        return result;
      } catch (error) {
        return reply.status(400).send({
          message:
            error instanceof Error
              ? error.message
              : "Unable to approve request",
        });
      }
    },
  );

  app.patch(
    "/:id/deny",
    {
      schema: denyHaulingRequestSchema,
      preHandler: [
        authGuard,
        requireRole(...adminRoles),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as {
          id: string;
        };

        const { denialReason } = request.body as {
          denialReason: string;
        };

        const result = await denyHaulingRequest(
          id,
          denialReason,
        );

        if (!result) {
          return reply.status(404).send({
            message: "Hauling request not found",
          });
        }

        return result;
      } catch (error) {
        return reply.status(400).send({
          message:
            error instanceof Error
              ? error.message
              : "Invalid denial reason",
        });
      }
    },
  );

  done();
};
