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
      const { id } = request.params as { id: string };

      const result = await approveHaulingRequest(id);

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
    { schema: haulingRequestParamsSchema },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const result = await denyHaulingRequest(id);

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