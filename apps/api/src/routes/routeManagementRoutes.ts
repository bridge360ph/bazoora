import type { FastifyInstance } from "fastify";

import type {
  UpdateRouteStatusRequest,
} from "@bazoora/shared";

import {
  authGuard,
  requireRole,
} from "../lib/auth.js";
import type {
  CreateRouteBody,
  UpdateRouteBody,
} from "../schemas/routeManagement.schema.js";
import {
  createRouteSchema,
  routeManagementParamsSchema,
  updateRouteSchema,
  updateRouteStatusSchema,
} from "../schemas/routeManagement.schema.js";
import {
  createRoute,
  getRouteById,
  getRoutes,
  updateRoute,
  updateRouteStatus,
} from "../services/routeManagementService.js";

const routeReadRoles = [
  "SUPER_ADMIN",
  "GOVERNMENT_ADMIN",
  "HAULING_ADMIN",
  "DRIVER",
  "ECO_AIDE",
] as const;

const routeAdminRoles = [
  "SUPER_ADMIN",
  "GOVERNMENT_ADMIN",
  "HAULING_ADMIN",
] as const;

export function routeManagementRoutes(
  app: FastifyInstance,
): void {
  app.get(
    "/",
    {
      preHandler: [
        authGuard,
        requireRole(...routeReadRoles),
      ],
    },
    () => {
      return getRoutes();
    },
  );

  app.get(
    "/:id",
    {
      schema: routeManagementParamsSchema,
      preHandler: [
        authGuard,
        requireRole(...routeReadRoles),
      ],
    },
    (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      const route = getRouteById(id);

      if (!route) {
        return reply.status(404).send({
          message: "Route not found",
        });
      }

      return reply.send(route);
    },
  );

  app.post(
    "/",
    {
      schema: createRouteSchema,
      preHandler: [
        authGuard,
        requireRole(...routeAdminRoles),
      ],
    },
    (request, reply) => {
      const body = request.body as CreateRouteBody;
      const route = createRoute(body);

      if (!route) {
        return reply.status(409).send({
          message: "Route already exists",
        });
      }

      return reply.send(route);
    },
  );

  app.patch(
    "/:id/status",
    {
      schema: updateRouteStatusSchema,
      preHandler: [
        authGuard,
        requireRole(...routeAdminRoles),
      ],
    },
    (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      const { status } =
        request.body as UpdateRouteStatusRequest;

      const route = updateRouteStatus(id, status);

      if (!route) {
        return reply.status(404).send({
          message: "Route not found",
        });
      }

      return reply.send(route);
    },
  );

  app.patch(
    "/:id",
    {
      schema: updateRouteSchema,
      preHandler: [
        authGuard,
        requireRole(...routeAdminRoles),
      ],
    },
    (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      const body = request.body as UpdateRouteBody;
      const route = updateRoute(id, body);

      if (!route) {
        return reply.status(404).send({
          message: "Route not found",
        });
      }

      return reply.send(route);
    },
  );
}
