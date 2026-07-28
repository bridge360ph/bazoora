import type { FastifyInstance } from "fastify";
import type { AssignEcoAideRequest } from "@bazoora/shared";

import {
  assignEcoAide,
  listEcoAideOptions,
  RouteAssignmentError,
} from "../services/routeAssignmentService.js";

import {
  assignEcoAideSchema
} from "../schemas/routeAssignment.schema.js";


function statusCodeFor(error: unknown): number {
  return error instanceof RouteAssignmentError
    ? error.statusCode
    : 400;
}


export function routeAssignmentRoutes(
  app: FastifyInstance,
) {

  app.get(
    "/eco-aides",
    async (_request, reply) => {
      try {
        return await listEcoAideOptions();
      } catch (error) {
        return reply.status(400).send({
          message: (error as Error).message,
        });
      }
    },
  );


  app.patch(
    "/:id/assign-eco-aide",
    {
      schema: assignEcoAideSchema,
    },
    async (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      const body = request.body as AssignEcoAideRequest;


      try {
        return await assignEcoAide(id, body);
      } catch (error) {
        return reply.status(statusCodeFor(error)).send({
          message: (error as Error).message,
        });
      }
    },
  );
}
