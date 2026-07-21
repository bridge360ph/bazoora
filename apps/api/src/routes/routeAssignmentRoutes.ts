import type { FastifyInstance } from "fastify";

import {
  assignEcoAide,
  assignTruck,
} from "../services/routeAssignmentService.js";

import {
  assignEcoAideSchema,
  assignTruckSchema,
} from "../schemas/routeAssignment.schema.js";


export function routeAssignmentRoutes(
  app: FastifyInstance,
) {

  app.patch(
    "/:id/assign-eco-aide",
    {
      schema: assignEcoAideSchema,
    },
    async (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      const body = request.body as {
        ecoAideId: string;
      };


      try {
        return await assignEcoAide(id, body);
      } catch (error) {
        return reply.status(400).send({
          message: (error as Error).message,
        });
      }
    },
  );


  app.patch(
    "/:id/assign-truck",
    {
      schema: assignTruckSchema,
    },
    async (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      const body = request.body as {
        truckId: string;
      };


      try {
        return await assignTruck(id, body);
      } catch (error) {
        return reply.status(400).send({
          message: (error as Error).message,
        });
      }
    },
  );
}
