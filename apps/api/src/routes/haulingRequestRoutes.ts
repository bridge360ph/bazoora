import type { FastifyPluginCallback } from "fastify";

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
  app.get("/", () => {
    return getHaulingRequests();
  });

  app.post(
    "/",
    { schema: createHaulingRequestSchema },
    (request) => {
      return createHaulingRequest(
        request.body as never,
      );
    },
  );

  app.patch(
    "/:id/approve",
    { schema: haulingRequestParamsSchema },
    (request, reply) => {
      const { id } = request.params as { id: string };

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
    { schema: haulingRequestParamsSchema },
    (request, reply) => {
      const { id } = request.params as { id: string };

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