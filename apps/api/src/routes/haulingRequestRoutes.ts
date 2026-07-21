import type { FastifyPluginCallback } from "fastify";
import type { CreateHaulingRequestInput } from "@bazoora/shared";

import {
  approveHaulingRequest,
  createHaulingRequest,
  denyHaulingRequest,
  getHaulingRequests,
} from "../services/haulingRequestService.js";

import {
  createHaulingRequestSchema,
  haulingRequestParamsSchema,
  denyHaulingRequestSchema,
} from "../schemas/haulingRequest.schema.js";

export const haulingRequestRoutes: FastifyPluginCallback = (
  app,
  _opts,
  done,
) => {
  app.get("/", async () => {
    return await getHaulingRequests();
  });

  app.post(
    "/",
    { schema: createHaulingRequestSchema },
    async (request) => {
      return await createHaulingRequest(
        request.body as CreateHaulingRequestInput,
      );
    },
  );

  app.patch(
    "/:id/approve",
    { schema: haulingRequestParamsSchema },
    async (request, reply) => {
      try {
        const { id } =
          request.params as { id: string };

        const result =
          await approveHaulingRequest(id);

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
    },
    async (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      const { denialReason } = request.body as {
        denialReason: string;
      };

      try {
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