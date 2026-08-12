import type { FastifyInstance } from "fastify";
import type { AssignEcoAideRequest } from "@bazoora/shared";

import {
  authGuard,
  requireRole,
} from "../lib/auth.js";
import {
  assignEcoAide,
  listEcoAideOptions,
  RouteAssignmentError,
} from "../services/routeAssignmentService.js";

import {
  assignEcoAideSchema
} from "../schemas/routeAssignment.schema.js";

// Assignment is an admin action, and the eco-aide option list exists only to
// populate the admin assignment selector, so both share the same roles.
const routeAdminRoles = [
  "SUPER_ADMIN",
  "GOVERNMENT_ADMIN",
  "HAULING_ADMIN",
] as const;


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
    {
      preHandler: [
        authGuard,
        requireRole(...routeAdminRoles),
      ],
    },
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
      preHandler: [
        authGuard,
        requireRole(...routeAdminRoles),
      ],
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
